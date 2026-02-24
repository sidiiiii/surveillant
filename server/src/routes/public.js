const express = require('express');
const router = express.Router();
const db = require('../database');

const toLatinDigits = (str) => {
    if (!str) return str;
    const arabic = '٠١٢٣٤٥٦٧٨٩';
    const farsi = '۰۱۲۳۴۵۶۷۸۹';
    return str.toString()
        .replace(/\s/g, '')
        .replace(/[٠-٩]/g, (d) => arabic.indexOf(d))
        .replace(/[۰-۹]/g, (d) => farsi.indexOf(d));
};

// Get student info and documents by NSI (Public Access)
router.get('/student/:nsi', async (req, res) => {
    try {
        let { nsi } = req.params;
        nsi = toLatinDigits(nsi);

        if (!nsi) {
            return res.status(400).json({ error: 'NSI est requis' });
        }

        // 1. Get Student Info
        const { rows: studentRows } = await db.query(`
            SELECT s.id, s.name, s.nsi, s.matricule, s.photo_url, 
                   c.name as class_name, sch.name as school_name, sch.logo_url as school_logo,
                   sch.status as school_status
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN schools sch ON s.school_id = sch.id
            WHERE s.nsi = $1
        `, [nsi]);
        const student = studentRows[0];

        if (!student) {
            return res.status(404).json({ error: 'Aucun élève trouvé avec ce NSI' });
        }

        if (student.school_status === 'suspended') {
            return res.status(403).json({ error: 'Le service pour cette école est temporairement suspendu.' });
        }

        // 2. Get Documents
        const { rows: documents } = await db.query(`
            SELECT * FROM student_documents 
            WHERE student_id = $1 
            ORDER BY created_at DESC
        `, [student.id]);

        // 3. Get Grades
        const { rows: grades } = await db.query(`
            SELECT g.*, sub.name as subject_name 
            FROM grades g
            JOIN subjects sub ON g.subject_id = sub.id
            WHERE g.student_id = $1
            ORDER BY g.date DESC
        `, [student.id]);

        // 4. SENTINELLE RISK ANALYSIS (Public version)
        // Absences last 30 days
        const { rows: attRows } = await db.query(`
            SELECT COUNT(*) as recent_absences 
            FROM attendance 
            WHERE student_id = $1 AND status = 'absent' AND date > CURRENT_DATE - INTERVAL '30 days'
        `, [student.id]);
        const recent_absences = parseInt(attRows[0]?.recent_absences || 0);

        // Consecutive bad grades
        const academic_alerts = [];
        // Group grades by subject
        const gradesBySubject = {};
        grades.forEach(g => {
            if (!gradesBySubject[g.subject_name]) gradesBySubject[g.subject_name] = [];
            gradesBySubject[g.subject_name].push(g.grade);
        });

        for (const subject in gradesBySubject) {
            const sGrades = gradesBySubject[subject];
            // Check consecutive pairs (descending date order in 'grades' array)
            for (let i = 0; i < sGrades.length - 1; i++) {
                if (sGrades[i] < 10 && sGrades[i + 1] < 10) {
                    academic_alerts.push({ subject, last_note: sGrades[i], prev_note: sGrades[i + 1] });
                    break; // One alert per subject is enough
                }
            }
        }

        const risks = [];
        if (recent_absences >= 3) {
            risks.push({ type: 'absenteeism', label: 'Absences élevées', severity: 'high' });
        }
        if (academic_alerts.length > 0) {
            const subjects = academic_alerts.map(a => a.subject);
            risks.push({
                type: 'academic',
                label: `Chute en ${subjects.join(', ')}`,
                severity: 'medium',
                details: academic_alerts
            });
        }

        res.json({
            student,
            documents,
            grades,
            sentinelle: {
                is_at_risk: risks.length > 0,
                risks,
                recent_absences
            }
        });

    } catch (error) {
        console.error('Error fetching public student data:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});

// Get public site settings (news, etc.)
router.get('/settings', async (req, res) => {
    try {
        // site_settings might not exist in the new schema yet if I didn't add it. 
        // I will add it to database.js later.
        // For now, write the query assuming it exists.
        const { rows: settings } = await db.query('SELECT * FROM site_settings');
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        res.json(settingsMap);
    } catch (error) {
        // If table doesn't exist, return empty object or handle error
        if (error.code === '42P01') { // undefined_table
            return res.json({});
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
