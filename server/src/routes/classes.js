const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Get all classes for the school
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows: classes } = await db.query('SELECT * FROM classes WHERE school_id = $1 ORDER BY cycle, niveau, name', [req.user.school_id]);
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new class
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { name, level, cycle, niveau } = req.body;
    console.log(`[Classes] Attempting to add class: "${name}" (${cycle} ${niveau}) for School ID: ${req.user.school_id}`);

    if (!name) {
        return res.status(400).json({ error: 'Nom de la classe requis' });
    }

    try {
        const { rows } = await db.query(
            'INSERT INTO classes (school_id, name, level, cycle, niveau) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [req.user.school_id, name, level || '', cycle || '', niveau || '']
        );
        const newClassId = rows[0].id;

        console.log(`[Classes] ✅ Success: Class added with ID ${newClassId}`);
        res.json({ id: newClassId, name, level, cycle, niveau });
    } catch (error) {
        console.error(`[Classes] ❌ Error adding class:`, error.message);
        if (error.message.includes('unique_violation') || error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Une classe avec ce nom existe déjà dans votre établissement' });
        }
        res.status(500).json({ error: 'Erreur serveur lors de l\'ajout de la classe: ' + error.message });
    }
});

// Delete a class
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        // Check if students are assigned to this class
        const { rows: studentCount } = await db.query('SELECT count(*) as count FROM students WHERE class_id = $1', [req.params.id]);
        if (parseInt(studentCount[0].count) > 0) {
            return res.status(400).json({ error: 'Impossible de supprimer une classe qui contient des élèves' });
        }

        const result = await db.query('DELETE FROM classes WHERE id = $1 AND school_id = $2', [req.params.id, req.user.school_id]);

        if (result.rowCount === 0) {
            console.log(`[Classes] ⚠️ Delete failed: Class ${req.params.id} not found or not owned by school ${req.user.school_id}`);
            return res.status(404).json({ error: 'Classe introuvable ou non autorisée' });
        }

        console.log(`[Classes] ✅ Deleted class ${req.params.id}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
