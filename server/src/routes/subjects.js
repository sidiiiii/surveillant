const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Get all subjects (Admin/Teacher/Parent?)
router.get('/', authenticateToken, async (req, res) => {
    const school_id = req.user.school_id;
    try {
        const { rows: subjects } = await db.query('SELECT * FROM subjects WHERE school_id = $1', [school_id]);
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Subject (Admin)
router.post('/', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { name } = req.body;
    const school_id = req.user.school_id;
    try {
        const { rows } = await db.query('INSERT INTO subjects (school_id, name) VALUES ($1, $2) RETURNING id', [school_id, name]);
        res.json({ id: rows[0].id, school_id, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Subject (Admin)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { id } = req.params;
    const school_id = req.user.school_id;
    try {
        const result = await db.query('DELETE FROM subjects WHERE id = $1 AND school_id = $2', [id, school_id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Subject not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
