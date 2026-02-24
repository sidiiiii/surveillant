
const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/analysis/risk?school_id=...
// Returns list of students with calculated risk factors
router.get('/risk', authenticateToken, async (req, res) => {
    try {
        const { school_id, student_id } = req.query;
        if (!school_id && !student_id) return res.status(400).json({ error: 'School ID or Student ID required' });

        // Logic (Updated V2.1):
        // 1. Get students (all for school or one specific)
        // 2. Count absences
        // 3. ANALYSE APPROFONDIE DES NOTES : 
        //    Trouver les élèves qui ont eu 2 notes < 10 CONSECUTIVES dans la MEME matière.

        let filterClause = 's.school_id = $1';
        let queryParams = [school_id];

        if (student_id) {
            filterClause = 's.id = $1';
            queryParams = [student_id];
        }

        const query = `
            WITH AttendanceStats AS (
                SELECT 
                    student_id, 
                    COUNT(*) FILTER (WHERE status = 'absent' AND date > CURRENT_DATE - INTERVAL '30 days') as recent_absences
                FROM attendance
                GROUP BY student_id
            ),
            RecentGrades AS (
                SELECT 
                    g.student_id,
                    g.subject_id,
                    s.name as subject_name,
                    g.grade,
                    g.date,
                    LAG(g.grade) OVER (PARTITION BY g.student_id, g.subject_id ORDER BY g.date ASC) as previous_grade
                FROM grades g
                JOIN subjects s ON g.subject_id = s.id
                -- Filter by student or school here to optimize
                WHERE ${student_id ? 'g.student_id = $1' : 's.school_id = $1'}
            )
            SELECT 
                s.id,
                s.name,
                s.matricule,
                s.photo_url,
                c.name as class_name,
                c.level as class_level,
                COALESCE(att.recent_absences, 0) as recent_absences,
                (
                    SELECT json_agg(json_build_object('subject', rg.subject_name, 'last_note', rg.grade, 'prev_note', rg.previous_grade))
                    FROM RecentGrades rg
                    WHERE rg.student_id = s.id 
                    AND rg.grade < 10 
                    AND rg.previous_grade < 10
                ) as academic_alerts
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN AttendanceStats att ON s.id = att.student_id
            WHERE ${filterClause}
            ORDER BY recent_absences DESC
        `;

        const result = await pool.query(query, queryParams);

        // Post-processing to determine "Risk Label"
        const studentsWithRisk = result.rows.map(student => {
            let risks = [];

            // Risk 1: Absences (> 3)
            if (parseInt(student.recent_absences) >= 3) {
                risks.push({ type: 'absenteeism', label: 'Absences élevées', severity: 'high' });
            }

            // Risk 2: Drop in Grades (2 consecutive bad grades in same subject)
            if (student.academic_alerts && student.academic_alerts.length > 0) {
                // Remove duplicates if any (though SQL shouldn't return many)
                const subjects = [...new Set(student.academic_alerts.map(a => a.subject))];
                risks.push({
                    type: 'academic',
                    label: `Chute en ${subjects.join(', ')}`,
                    severity: 'medium',
                    details: student.academic_alerts
                });
            }

            return {
                ...student,
                risks: risks,
                is_at_risk: risks.length > 0
            };
        });

        // Filter to only return students with at least one risk for the "Sentinelle" widget
        const highRiskStudents = studentsWithRisk.filter(s => s.is_at_risk);

        res.json(highRiskStudents);
    } catch (err) {
        console.error('Error in risk analysis:', err);
        res.status(500).json({ error: 'Server error analyzing risks' });
    }
});

// GET /api/analysis/performance?school_id=...
router.get('/performance', authenticateToken, async (req, res) => {
    try {
        const { school_id } = req.query;
        if (!school_id) return res.status(400).json({ error: 'School ID required' });

        // 1. Best Student per Subject
        const bestStudentsQuery = `
            WITH StudentSubjectAverages AS (
                SELECT 
                    s.id as student_id,
                    s.name as student_name,
                    c.name as class_name,
                    sub.id as subject_id,
                    sub.name as subject_name,
                    AVG(g.grade) as avg_grade
                FROM grades g
                JOIN students s ON g.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN subjects sub ON g.subject_id = sub.id
                WHERE s.school_id = $1
                GROUP BY s.id, s.name, c.name, sub.id, sub.name
            ),
            RankedStudents AS (
                SELECT 
                    *,
                    ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY avg_grade DESC) as rank
                FROM StudentSubjectAverages
            )
            SELECT * FROM RankedStudents WHERE rank = 1 ORDER BY subject_name;
        `;

        // 2. Best Class per Subject
        const bestClassesQuery = `
            WITH ClassSubjectAverages AS (
                SELECT 
                    c.id as class_id,
                    c.name as class_name,
                    c.niveau as class_level,
                    sub.id as subject_id,
                    sub.name as subject_name,
                    AVG(g.grade) as avg_grade
                FROM grades g
                JOIN students s ON g.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                JOIN subjects sub ON g.subject_id = sub.id
                WHERE s.school_id = $1
                GROUP BY c.id, c.name, c.niveau, sub.id, sub.name
            ),
            RankedClasses AS (
                SELECT 
                    *,
                    ROW_NUMBER() OVER (PARTITION BY subject_id ORDER BY avg_grade DESC) as rank
                FROM ClassSubjectAverages
            )
            SELECT * FROM RankedClasses WHERE rank = 1 ORDER BY subject_name;
        `;

        // 3. Global Class Performance
        const classPerformanceQuery = `
            SELECT 
                c.id as class_id,
                c.name as class_name,
                c.niveau as class_level,
                c.cycle as class_cycle,
                AVG(g.grade) as avg_grade,
                COUNT(DISTINCT s.id) as student_count
            FROM grades g
            JOIN students s ON g.student_id = s.id
            JOIN classes c ON s.class_id = c.id
            WHERE s.school_id = $1
            GROUP BY c.id, c.name, c.niveau, c.cycle
            ORDER BY avg_grade DESC;
        `;

        const [bestStudents, bestClasses, classPerf] = await Promise.all([
            pool.query(bestStudentsQuery, [school_id]),
            pool.query(bestClassesQuery, [school_id]),
            pool.query(classPerformanceQuery, [school_id])
        ]);

        res.json({
            bestStudents: bestStudents.rows,
            bestClasses: bestClasses.rows,
            classPerformance: classPerf.rows
        });

    } catch (err) {
        console.error('Error in performance analysis:', err);
        res.status(500).json({ error: 'Server error analyzing performance' });
    }
});

module.exports = router;
