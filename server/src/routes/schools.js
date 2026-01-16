const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Get Generic School Info
router.get('/my-school', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const { rows } = await db.query('SELECT name, unique_code, subscription_end_date, status FROM schools WHERE id = $1', [req.user.school_id]);
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

// Update Email Settings
router.post('/email-settings', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { smtp_host, smtp_port, smtp_user, smtp_pass } = req.body;
    const school_id = req.user.school_id;

    console.log(`[EmailSettings] Update request for School ID ${school_id}`);
    console.log(`[EmailSettings] Payload: Host=${smtp_host}, User=${smtp_user}, Pass provided? ${!!smtp_pass}`);

    try {
        if (smtp_pass === undefined) {
            // Password not provided => Do not update it
            await db.query(`
                UPDATE schools 
                SET smtp_host = $1, smtp_port = $2, smtp_user = $3
                WHERE id = $4
            `, [smtp_host || 'smtp.gmail.com', smtp_port || 587, smtp_user, school_id]);
        } else {
            // Password provided => Update it
            await db.query(`
                UPDATE schools 
                SET smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_pass = $4
                WHERE id = $5
            `, [smtp_host || 'smtp.gmail.com', smtp_port || 587, smtp_user, smtp_pass, school_id]);
        }

        res.json({ success: true, message: 'Paramètres email mis à jour avec succès' });
    } catch (error) {
        console.error('Email Settings Update Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Email Settings (Safe - no password)
router.get('/email-settings', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const school_id = req.user.school_id;
    try {
        const { rows: settingsRows } = await db.query('SELECT smtp_host, smtp_port, smtp_user, email FROM schools WHERE id = $1', [school_id]);
        const settings = settingsRows[0];

        // Check if password exists (return true/false instead of value)
        const { rows: passCheckRows } = await db.query('SELECT smtp_pass FROM schools WHERE id = $1', [school_id]);
        const passCheck = passCheckRows[0];

        if (settings) {
            settings.has_password = !!(passCheck && passCheck.smtp_pass);
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test Email Configuration
router.post('/test-email-config', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const { smtp_host, smtp_port, smtp_user, smtp_pass, test_email } = req.body;
    const { sendEmail } = require('../services/emailService');

    try {
        console.log(`[TestEmail] Testing config for user: ${smtp_user}`);
        await sendEmail(test_email, 'Test Configuration Email', '<h1>Configuration Réussie!</h1><p>Si vous recevez cet email, vos paramètres SMTP sont corrects.</p>', {
            smtp_host,
            smtp_port,
            smtp_user,
            smtp_pass,
            name: 'Test École',
            email: smtp_user
        });
        res.json({ success: true, message: 'Email de test envoyé avec succès !' });
    } catch (error) {
        console.error('[TestEmail] Failed:', error);
        res.status(400).json({ error: 'Échec de l\'envoi : ' + error.message });
    }
});

module.exports = router;
