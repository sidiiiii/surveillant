const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Get attendance for student
router.get('/:studentId', authenticateToken, async (req, res) => {
    const studentId = req.params.studentId;
    try {
        const { rows: attendance } = await db.query('SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC', [studentId]);
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark Attendance (Teacher/Admin)
router.post('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
    const { student_id, date, status } = req.body; // status: 'present', 'absent', 'late'

    try {
        const { rows: insertRows } = await db.query(`
            INSERT INTO attendance (student_id, date, status, notification_sent)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [student_id, date, status, false]);

        const newAttendanceId = insertRows[0].id;

        // Automatic Notification Rule: If absent -> Send Email
        const absenceTypes = ['absent', 'absent_8h_10h', 'absent_10h_12h', 'absent_12h_14h'];

        if (absenceTypes.includes(status)) {
            const { rows: studentRows } = await db.query(`
                SELECT s.parent_id, s.name, s.parent_email, sch.name as school_name, sch.email as school_email,
                       sch.smtp_user, sch.smtp_pass, sch.smtp_host, sch.smtp_port
                FROM students s
                JOIN schools sch ON s.school_id = sch.id 
                WHERE s.id = $1
            `, [student_id]);
            const student = studentRows[0];

            if (student && student.parent_email) {
                const { sendEmail } = require('../services/emailService');

                let timeRangeAr = '';
                let timeRangeFr = '';

                if (status === 'absent_8h_10h') {
                    timeRangeAr = ' (من 8:00 إلى 10:00)';
                    timeRangeFr = ' (de 08h à 10h)';
                } else if (status === 'absent_10h_12h') {
                    timeRangeAr = ' (من 10:00 إلى 12:00)';
                    timeRangeFr = ' (de 10h à 12h)';
                } else if (status === 'absent_12h_14h') {
                    timeRangeAr = ' (من 12:00 إلى 14:00)';
                    timeRangeFr = ' (de 12h à 14h)';
                }

                const subject = `Alerte d'absence / تنبيه غياب: ${student.name}`;
                const content = {
                    ar: `
                        <h3 style="color: #ef4444;">⚠️ تنبيه غياب</h3>
                        <p>مرحباً،</p>
                        <p>لقد تم تسجيل الطالب <strong>${student.name}</strong> كـ <strong>غائب${timeRangeAr}</strong> في تاريخ ${date}.</p>
                        <p>يرجى التواصل مع المدرسة في أقرب وقت ممكن.</p>
                    `,
                    fr: `
                        <h3 style="color: #ef4444;">⚠️ Alerte d'Absence</h3>
                        <p>Bonjour,</p>
                        <p>Votre enfant <strong>${student.name}</strong> a été marqué <strong>ABSENT${timeRangeFr}</strong> le ${date}.</p>
                        <p>Merci de contacter l'établissement dans les plus brefs délais.</p>
                    `
                };

                // Send Email
                console.log(`[Notification] Sending Absence Alert (${status}) to ${student.parent_email}...`);
                sendEmail(
                    student.parent_email,
                    subject,
                    content,
                    {
                        name: student.school_name,
                        email: student.school_email,
                        smtp_user: student.smtp_user,
                        smtp_pass: student.smtp_pass,
                        smtp_host: student.smtp_host,
                        smtp_port: student.smtp_port
                    }
                ).catch(err => console.error('[Notification] Email Failed:', err));

                // Record notification logic
                if (student.parent_id) {
                    await db.query('INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)', [
                        student.parent_id,
                        'absence',
                        `Absence Alert: ${student.name} was marked absent ${timeRangeFr} on ${date}.`
                    ]);
                }

                // Update attendance record to say notification sent
                await db.query('UPDATE attendance SET notification_sent = $1 WHERE id = $2', [true, newAttendanceId]);
            } else {
                console.log(`[Notification] Skipped email: No parent email found for student ${student_id}`);
            }
        }

        res.json({ id: newAttendanceId, success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Attendance Entry
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
    const { id } = req.params;
    const { school_id } = req.user;

    try {
        // Verify entry belongs to a student in this school
        const { rows: entryRows } = await db.query(`
            SELECT a.id FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.id = $1 AND s.school_id = $2
        `, [id, school_id]);
        const entry = entryRows[0];

        if (!entry) {
            return res.status(404).json({ error: 'Enregistrement non trouvé ou accès non autorisé' });
        }

        await db.query('DELETE FROM attendance WHERE id = $1', [id]);
        res.json({ success: true, message: 'Enregistrement supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
