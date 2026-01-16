const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const { sendEmail } = require('../services/emailService');

// Get grades for a student
router.get('/:studentId', authenticateToken, async (req, res) => {
    // Check permission: Admin, Teacher, or Parent of that student
    const studentId = req.params.studentId;
    const user = req.user;

    try {
        if (user.role === 'parent') {
            const { rows: studentRows } = await db.query('SELECT parent_id FROM students WHERE id = $1', [studentId]);
            const student = studentRows[0];
            if (!student || student.parent_id !== user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const { rows: grades } = await db.query(`
      SELECT g.*, s.name as subject_name 
      FROM grades g
      JOIN subjects s ON g.subject_id = s.id
      WHERE g.student_id = $1
      ORDER BY g.date DESC
    `, [studentId]);
        res.json(grades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Grade
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
    const { student_id, subject_id, grade, type, period, comment } = req.body;

    if (!student_id || !subject_id || grade === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows: insertRows } = await db.query(`
      INSERT INTO grades (student_id, subject_id, grade, type, period, comment)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [student_id, subject_id, grade, type, period, comment]);

        const newGradeId = insertRows[0].id;

        // --- Notification Logic ---
        try {
            console.log('[NOTIF] Starting notification process for grade:', { student_id, subject_id, grade });

            // 1. Get Student & Parent Info & School Info
            const { rows: studentInfoRows } = await db.query(`
                SELECT s.name as student_name, s.parent_email, s.parent_id, u.email as linked_parent_email, sub.name as subject_name,
                       sch.name as school_name, sch.email as school_email, 
                       sch.smtp_user, sch.smtp_pass, sch.smtp_host, sch.smtp_port
                FROM students s
                LEFT JOIN users u ON s.parent_id = u.id
                JOIN subjects sub ON sub.id = $1
                JOIN schools sch ON s.school_id = sch.id
                WHERE s.id = $2
            `, [subject_id, student_id]);
            const studentInfo = studentInfoRows[0];

            console.log('[NOTIF] Student info retrieved:', studentInfo);

            if (studentInfo) {
                const parentEmail = studentInfo.linked_parent_email || studentInfo.parent_email;
                console.log('[NOTIF] Parent email:', parentEmail);

                // 2. Create Notification Record
                if (studentInfo.parent_id) {
                    const typeLabels = {
                        'Exam': 'Examen',
                        'Homework': 'Devoir',
                        'Exercise_School': 'Exercice école',
                        'Exercise_Home': 'Exercice maison',
                        'examen': 'Examen',
                        'devoir': 'Devoir',
                        'exercice_ecole': 'Exercice à l\'école',
                        'exercice_maison': 'Exercice à la maison'
                    };
                    const typeLabel = typeLabels[type] || type;
                    const message = `Nouvelle note pour ${studentInfo.student_name} en ${studentInfo.subject_name} (${typeLabel}): ${grade}/20`;
                    await db.query('INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)', [studentInfo.parent_id, 'grade', message]);
                    console.log('[NOTIF] In-app notification created for parent ID:', studentInfo.parent_id);
                } else {
                    console.log('[NOTIF] No parent_id, skipping in-app notification');
                }

                // 3. Send Email
                if (parentEmail) {
                    console.log('[NOTIF] Attempting to send email to:', parentEmail);

                    const typeLabels = {
                        'Exam': 'Examen',
                        'Homework': 'Devoir',
                        'Exercise_School': 'Exercice à l\'école',
                        'Exercise_Home': 'Exercice à la maison'
                    };
                    const typeLabel = typeLabels[type] || type;

                    const subject = `Nouvelle Note / درجة جديدة: ${studentInfo.student_name}`;
                    const content = {
                        ar: `
                            <h3 style="color: #4f46e5;">📚 تم تسجيل درجة جديدة</h3>
                            <p><strong>الطالب:</strong> ${studentInfo.student_name}</p>
                            <p><strong>المادة:</strong> ${studentInfo.subject_name}</p>
                            <p><strong>النوع:</strong> ${typeLabel}</p>
                            <p><strong>الدرجة:</strong> <span style="font-size: 24px; font-weight: bold; color: ${grade >= 10 ? '#10b981' : '#ef4444'};">${grade}/20</span></p>
                            ${comment ? `<p><strong>ملاحظة:</strong> ${comment}</p>` : ''}
                            <p>يرجى تسجيل الدخول إلى حسابكم للمزيد من التفاصيل.</p>
                        `,
                        fr: `
                            <h3 style="color: #4f46e5;">📚 Nouvelle Note Enregistrée</h3>
                            <p><strong>Élève:</strong> ${studentInfo.student_name}</p>
                            <p><strong>Matière:</strong> ${studentInfo.subject_name}</p>
                            <p><strong>Type:</strong> ${typeLabel}</p>
                            <p><strong>Note:</strong> <span style="font-size: 24px; font-weight: bold; color: ${grade >= 10 ? '#10b981' : '#ef4444'};">${grade}/20</span></p>
                            ${comment ? `<p><strong>Commentaire:</strong> ${comment}</p>` : ''}
                            <p>Connectez-vous à votre compte parent pour voir tous les détails.</p>
                        `
                    };

                    // Fire and forget email with SMART SENDER INFO
                    sendEmail(parentEmail, subject, content, {
                        name: studentInfo.school_name,
                        email: studentInfo.school_email,
                        smtp_user: studentInfo.smtp_user,
                        smtp_pass: studentInfo.smtp_pass,
                        smtp_host: studentInfo.smtp_host,
                        smtp_port: studentInfo.smtp_port
                    })
                        .then(() => console.log('[NOTIF] ✅ Email sent successfully to:', parentEmail))
                        .catch(err => console.error('[NOTIF] ❌ Email error:', err));
                } else {
                    console.log('[NOTIF] No parent email found, skipping email notification');
                }
            } else {
                console.log('[NOTIF] No student info found');
            }
        } catch (notifError) {
            console.error('[NOTIF] Notification error:', notifError);
            // Don't fail the request if notification fails
        }
        // --------------------------

        res.json({ id: newGradeId, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Grade
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
    const { id } = req.params;
    const { school_id } = req.user;

    try {
        // Verify grade belongs to a student in this school
        const { rows: gradeRows } = await db.query(`
            SELECT g.id FROM grades g
            JOIN students s ON g.student_id = s.id
            WHERE g.id = $1 AND s.school_id = $2
        `, [id, school_id]);
        const grade = gradeRows[0];

        if (!grade) {
            return res.status(404).json({ error: 'Note non trouvée ou accès non autorisé' });
        }

        await db.query('DELETE FROM grades WHERE id = $1', [id]);
        res.json({ success: true, message: 'Note supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
