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

// Get student info and documents by NNI (Public Access)
router.get('/student/:nni', async (req, res) => {
    try {
        let { nni } = req.params;
        nni = toLatinDigits(nni);

        if (!nni) {
            return res.status(400).json({ error: 'NNI est requis' });
        }

        // 1. Get Student Info
        const { rows: studentRows } = await db.query(`
            SELECT s.id, s.name, s.nni, s.matricule, s.photo_url, 
                   c.name as class_name, sch.name as school_name, sch.logo_url as school_logo,
                   sch.status as school_status
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            JOIN schools sch ON s.school_id = sch.id
            WHERE s.nni = $1
        `, [nni]);
        const student = studentRows[0];

        if (!student) {
            return res.status(404).json({ error: 'Aucun élève trouvé avec ce NNI' });
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

        res.json({
            student,
            documents,
            grades
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
