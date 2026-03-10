const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Get Generic School Info
router.get('/my-school', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { rows } = await db.query('SELECT id, name, unique_code, subscription_end_date, status FROM schools WHERE id = $1', [req.user.school_id]);
        if (rows.length === 0) return res.status(404).json({ error: 'School not found' });

        const school = rows[0];

        // Also fetch global support WhatsApp from site_settings
        const { rows: settingsRows } = await db.query("SELECT value FROM site_settings WHERE key = 'support_whatsapp'");
        school.support_whatsapp = settingsRows[0]?.value || '22246473111'; // Default as fallback

        res.json(school);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
