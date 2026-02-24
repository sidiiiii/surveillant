const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware to check if user is superadmin
const isSuperAdmin = async (req, res, next) => {
    try {
        const { rows } = await db.query('SELECT is_superadmin FROM users WHERE id = $1', [req.user.id]);
        const user = rows[0];
        if (user && user.is_superadmin) {
            next();
        } else {
            res.status(403).json({ error: 'Access denied: SuperAdmin only' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

router.use(authenticateToken);
router.use(isSuperAdmin);

// Get all schools with student counts and billing info
router.get('/schools', async (req, res) => {
    try {
        const { rows: schools } = await db.query(`
            SELECT 
                s.*,
                (SELECT email FROM users u WHERE u.school_id = s.id AND u.role = 'admin' LIMIT 1) as admin_email,
                (SELECT COUNT(*) FROM students src WHERE src.school_id = s.id) as student_count,
                (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id AND u.role = 'admin') as admin_count
            FROM schools s
            ORDER BY s.id DESC
        `);

        const schoolsWithBilling = schools.map(school => ({
            ...school,
            billing_amount: parseInt(school.student_count) * 10
        }));

        console.log(`[API] Sending ${schoolsWithBilling.length} schools to SuperAdmin`);
        res.json(schoolsWithBilling);
    } catch (error) {
        console.error('[API Error] superadmin/schools:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update school subscription
router.patch('/schools/:id/subscription', async (req, res) => {
    const { id } = req.params;
    let { days } = req.body;

    days = parseInt(days);

    if (!days || isNaN(days)) {
        return res.status(400).json({ error: 'Nombre de jours requis (entier)' });
    }

    try {
        console.log(`[SuperAdmin] Setting subscription for school ${id} to ${days} days from now.`);
        // Set end date to Now + X days, and reset pause state
        const result = await db.query(
            "UPDATE schools SET subscription_end_date = CURRENT_TIMESTAMP + ($1 * INTERVAL '1 day'), is_paused = FALSE, subscription_remaining_ms = NULL, status = 'active' WHERE id = $2 RETURNING subscription_end_date",
            [days, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'École non trouvée' });
        }

        const newDate = result.rows[0].subscription_end_date;
        console.log(`[SuperAdmin] New date: ${newDate}`);

        res.json({
            message: `Abonnement mis à jour (+${days} jours)`,
            subscription_end_date: newDate
        });
    } catch (error) {
        console.error('[SuperAdmin] Subscription Update Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update school status (suspend/activate)
router.patch('/schools/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const result = await db.query('UPDATE schools SET status = $1 WHERE id = $2', [status, id]);
        if (result.rowCount > 0) {
            res.json({ message: `School status updated to ${status}` });
        } else {
            res.status(404).json({ error: 'School not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pause school subscription
router.post('/schools/:id/pause', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT subscription_end_date, is_paused FROM schools WHERE id = $1', [id]);
        const school = rows[0];

        if (!school) return res.status(404).json({ error: 'School not found' });
        if (school.is_paused) return res.status(400).json({ error: 'Already paused' });
        if (!school.subscription_end_date) return res.status(400).json({ error: 'No active subscription to pause' });

        const endDate = new Date(school.subscription_end_date);
        const now = new Date();
        const remainingMs = endDate - now;

        if (remainingMs <= 0) return res.status(400).json({ error: 'Subscription already expired' });

        await db.query(
            'UPDATE schools SET is_paused = TRUE, subscription_remaining_ms = $1, subscription_end_date = NULL, status = $2 WHERE id = $3',
            [remainingMs, 'suspended', id]
        );

        res.json({ success: true, message: 'Subscription paused' });
    } catch (error) {
        console.error('Pause error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Resume school subscription
router.post('/schools/:id/resume', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query('SELECT subscription_remaining_ms, is_paused FROM schools WHERE id = $1', [id]);
        const school = rows[0];

        if (!school) return res.status(404).json({ error: 'School not found' });
        if (!school.is_paused) return res.status(400).json({ error: 'School is not paused' });

        const remainingMs = parseInt(school.subscription_remaining_ms);
        const newEndDate = new Date(Date.now() + remainingMs);

        await db.query(
            "UPDATE schools SET is_paused = FALSE, subscription_remaining_ms = NULL, subscription_end_date = $1, status = 'active' WHERE id = $2",
            [newEndDate, id]
        );

        res.json({ success: true, message: 'Subscription resumed', subscription_end_date: newEndDate });
    } catch (error) {
        console.error('Resume error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.patch('/schools/:id/details', async (req, res) => {
    const { id } = req.params;
    const { unique_code, name, admin_email } = req.body;

    const client = await db.pool.connect();

    try {
        if (unique_code) {
            const { rows: existingCode } = await client.query('SELECT id FROM schools WHERE LOWER(unique_code) = LOWER($1) AND id != $2', [unique_code, id]);
            if (existingCode.length > 0) {
                return res.status(400).json({ error: `Le code '${unique_code}' est déjà utilisé par une autre école.` });
            }
        }

        if (admin_email) {
            const { rows: existing } = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND (school_id != $2 OR role != \'admin\')', [admin_email, id]);
            if (existing.length > 0) {
                return res.status(400).json({ error: `L'adresse e-mail '${admin_email}' est déjà utilisée par un autre compte.` });
            }
        }

        await client.query('BEGIN');

        const schoolUpdates = [];
        const schoolParams = [];
        let paramIndex = 1;

        if (unique_code !== undefined) { schoolUpdates.push(`unique_code = $${paramIndex++}`); schoolParams.push(unique_code); }
        if (name !== undefined) { schoolUpdates.push(`name = $${paramIndex++}`); schoolParams.push(name); }

        if (schoolUpdates.length > 0) {
            schoolParams.push(id);
            await client.query(`UPDATE schools SET ${schoolUpdates.join(', ')} WHERE id = $${paramIndex}`, schoolParams);
        }

        if (admin_email !== undefined) {
            await client.query("UPDATE users SET email = $1 WHERE school_id = $2 AND role = 'admin'", [admin_email, id]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Informations de l\'école mises à jour' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update school details error:', error);
        res.status(500).json({ error: error.message.includes('unique_violation') ? 'Cette valeur est déjà utilisée.' : error.message });
    } finally {
        client.release();
    }
});

const bcrypt = require('bcryptjs'); // Add bcrypt import

router.patch('/profile/email', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'L\'email est requis' });

    try {
        const { rows: existing } = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [email, req.user.id]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Cet e-mail est déjà utilisé par un autre compte.' });
        }

        const result = await db.query('UPDATE users SET email = $1 WHERE id = $2 AND is_superadmin = TRUE', [email, req.user.id]);
        if (result.rowCount > 0) {
            res.json({ message: 'Email du SuperAdmin mis à jour' });
        } else {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
    } catch (error) {
        console.error('Update profile email error:', error);
        res.status(500).json({ error: error.message.includes('unique_violation') ? 'Cet e-mail est déjà utilisé.' : error.message });
    }
});

router.patch('/profile/password', async (req, res) => {
    const { password } = req.body;
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await db.query('UPDATE users SET password = $1 WHERE id = $2 AND is_superadmin = TRUE', [hash, req.user.id]);

        if (result.rowCount > 0) {
            res.json({ message: 'Mot de passe mis à jour avec succès' });
        } else {
            res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete school and all related data
router.delete('/schools/:id', async (req, res) => {
    const { id } = req.params;

    const client = await db.pool.connect();

    try {
        // PostgreSQL foreign key checks are transaction scoped if deferred, but usually we just delete children first.
        // We will manually delete children first as per logic.
        await client.query('BEGIN');

        await client.query('DELETE FROM grades WHERE student_id IN (SELECT id FROM students WHERE school_id = $1)', [id]);
        await client.query('DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE school_id = $1)', [id]);
        await client.query('DELETE FROM student_documents WHERE student_id IN (SELECT id FROM students WHERE school_id = $1)', [id]);
        await client.query('DELETE FROM notifications WHERE user_id IN (SELECT id FROM users WHERE school_id = $1)', [id]);
        await client.query('DELETE FROM students WHERE school_id = $1', [id]);
        await client.query('DELETE FROM classes WHERE school_id = $1', [id]);
        await client.query('DELETE FROM subjects WHERE school_id = $1', [id]);
        await client.query('DELETE FROM users WHERE school_id = $1 AND is_superadmin IS NOT TRUE', [id]);

        // Detach SuperAdmins from this school before deleting it
        await client.query('UPDATE users SET school_id = NULL WHERE school_id = $1', [id]);

        // Finally delete the school
        const result = await client.query('DELETE FROM schools WHERE id = $1', [id]);

        await client.query('COMMIT');

        if (result.rowCount > 0) {
            res.json({ message: 'L\'école et toutes ses données ont été supprimées avec succès.' });
        } else {
            res.status(404).json({ error: 'École non trouvée' });
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete school error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get general stats
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            total_schools: (await db.query('SELECT COUNT(*) as count FROM schools')).rows[0].count,
            total_students: (await db.query('SELECT COUNT(*) as count FROM students')).rows[0].count,
            // total_revenue calc:
            total_revenue: (await db.query('SELECT COUNT(*) as count FROM students')).rows[0].count * 10,
            active_schools: (await db.query("SELECT COUNT(*) as count FROM schools WHERE status = 'active'")).rows[0].count,
            suspended_schools: (await db.query("SELECT COUNT(*) as count FROM schools WHERE status = 'suspended'")).rows[0].count
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get site settings
router.get('/settings', async (req, res) => {
    try {
        const { rows: settings } = await db.query('SELECT * FROM site_settings');
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        res.json(settingsMap);
    } catch (error) {
        if (error.code === '42P01') return res.json({}); // Table doesn't exist
        res.status(500).json({ error: error.message });
    }
});

// Update site settings
router.post('/settings', async (req, res) => {
    const { key, value } = req.body;
    try {
        // Postgres UPSERT
        await db.query(`
            INSERT INTO site_settings (key, value) VALUES ($1, $2)
            ON CONFLICT (key) DO UPDATE SET value = $2
        `, [key, value]);
        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Configure Multer for notification uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use path.join(__dirname, '../../uploads/notifications') for consistency with how static files are checked in express static
        // Actually, let's stick to process.cwd() BUT ensure the directory exists relative to CWD.
        // If index.js serves path.join(process.cwd(), 'uploads'), then we must write to path.join(process.cwd(), 'uploads').
        const uploadDir = path.join(process.cwd(), 'uploads/notifications');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
    fileFilter: (req, file, cb) => {
        // Accept more video formats including quicktime (mov), avi, mkv
        const filetypes = /jpeg|jpg|png|gif|mp4|webm|ogg|mov|avi|mkv|quicktime/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype || extname) { // Allow if EITHER matches (some browsers send weird mimetypes)
            return cb(null, true);
        }
        cb(new Error('Format non supporté. Utilisez MP4, MOV, AVI, JPG, PNG...'));
    }
});

// Video Ad Config
const adStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads/ads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ad-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAd = multer({
    storage: adStorage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /mp4|webm|ogg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Uniquement des vidéos (mp4, webm, ogg) sont autorisées pour la publicité!'));
    }
});

// Send notification to all parents AND update global public news
router.post('/notify-parents', (req, res, next) => {
    upload.array('media', 3)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ error: `Erreur Upload: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ error: err.message });
        }
        // Everything went fine.
        next();
    });
}, async (req, res) => {
    console.log('--- Notify Parents Request ---');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { message } = req.body;

    if (!message && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ error: 'Message or Media is required' });
    }

    const client = await db.pool.connect();

    try {
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(file => ({
                url: `/uploads/notifications/${file.filename}`,
                type: file.mimetype.startsWith('video') ? 'video' : 'image'
            }));
        }

        const notificationMessage = message || '';

        await client.query('BEGIN');

        // 1. Update Global News for Public Users (NSI access)
        const upsertSetting = 'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2';

        await client.query(upsertSetting, ['global_news', notificationMessage]);

        const locations = req.body.display_locations || 'home,student';
        await client.query(upsertSetting, ['global_news_display_locations', locations]);

        if (attachments.length > 0) {
            await client.query(upsertSetting, ['global_news_attachments', JSON.stringify(attachments)]);
            await client.query(upsertSetting, ['global_news_media_url', attachments[0].url]);
            await client.query(upsertSetting, ['global_news_media_type', attachments[0].type]);
        } else {
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_attachments'");
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_media_url'");
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_media_type'");
        }

        // 2. Send Notification to Registered Parents
        const primaryMediaUrl = attachments.length > 0 ? attachments[0].url : null;
        const primaryMediaType = attachments.length > 0 ? attachments[0].type : null;

        const { rows: parents } = await client.query("SELECT id FROM users WHERE role = 'parent'");

        for (const parent of parents) {
            await client.query(
                "INSERT INTO notifications (user_id, message, media_url, media_type, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)",
                [parent.id, notificationMessage, primaryMediaUrl, primaryMediaType]
            );
        }

        await client.query('COMMIT');

        res.json({ message: `Notification sent to ${parents.length} parents.` });
    } catch (error) {
        await client.query('ROLLBACK');
        if (req.files) {
            req.files.forEach(file => {
                try { fs.unlinkSync(file.path); } catch (e) { }
            });
        }
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get recent notification history (unique broadcasts)
router.get('/notifications-history', async (req, res) => {
    try {
        const { rows: history } = await db.query(`
            SELECT 
                MIN(id) as id, 
                message, 
                media_url, 
                media_type, 
                created_at,
                COUNT(*) as reach
            FROM notifications 
            GROUP BY message, media_url, media_type, created_at
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete specific notification from history
// Delete specific notification from history
router.delete('/notifications/:id', async (req, res) => {
    const { id } = req.params;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Get the notification to be deleted
        const { rows: target } = await client.query("SELECT message, media_url, created_at FROM notifications WHERE id = $1", [id]);

        if (target.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Notification not found' });
        }

        const notification = target[0];

        // 2. Check if this is the currently active global notification (Site Settings)
        const { rows: settings } = await client.query("SELECT key, value FROM site_settings WHERE key IN ('global_news', 'global_news_media_url')");
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        const currentGlobalMsg = settingsMap['global_news'];
        const currentGlobalMedia = settingsMap['global_news_media_url'];

        // Normalize for comparison (empty string vs null)
        const notifMsg = notification.message || '';
        const globMsg = currentGlobalMsg || '';
        const notifMedia = notification.media_url || null;
        const globMedia = currentGlobalMedia || null;

        // If it matches the active broadcast, clear the site settings
        if (notifMsg === globMsg && notifMedia === globMedia) {
            console.log(`[Delete Notif] Deleting active global notification as it matches history item ${id}`);
            await client.query("DELETE FROM site_settings WHERE key = 'global_news'");
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_display_locations'");
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_attachments'");
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_media_url'");
            await client.query("DELETE FROM site_settings WHERE key = 'global_news_media_type'");
        }

        // 3. Delete from history (notifications table)
        // We delete all notifications sent with the exact same message/media/time to keep history clean (as they were likely a batch)
        await client.query(
            "DELETE FROM notifications WHERE message = $1 AND created_at = $2 AND (media_url = $3 OR (media_url IS NULL AND $3 IS NULL))",
            [notification.message, notification.created_at, notification.media_url]
        );

        await client.query('COMMIT');
        res.json({ message: 'Broadcast deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Delete current global notification
router.delete('/delete-notification', async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("DELETE FROM site_settings WHERE key = 'global_news'");
        await client.query("DELETE FROM site_settings WHERE key = 'global_news_display_locations'");
        await client.query("DELETE FROM site_settings WHERE key = 'global_news_attachments'");
        await client.query("DELETE FROM site_settings WHERE key = 'global_news_media_url'");
        await client.query("DELETE FROM site_settings WHERE key = 'global_news_media_type'");
        await client.query('COMMIT');

        res.json({ message: 'Global notification deleted successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Video Ad Routes
router.post('/video-ad', uploadAd.single('video'), async (req, res) => {
    try {
        const { enabled, locations } = req.body;
        const upsert = 'INSERT INTO site_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2';

        if (req.file) {
            const videoUrl = `/uploads/ads/${req.file.filename}`;
            await db.query(upsert, ['video_ad_url', videoUrl]);
        }

        if (enabled !== undefined) {
            await db.query(upsert, ['video_ad_enabled', enabled]);
        }

        if (locations !== undefined) {
            await db.query(upsert, ['video_ad_locations', locations]);
        }

        res.json({ message: 'Publicité vidéo mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/video-ad', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT value FROM site_settings WHERE key = 'video_ad_url'");
        const currentUrl = rows[0]?.value;

        if (currentUrl) {
            const filePath = path.join(__dirname, '../..', currentUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await db.query("UPDATE site_settings SET value = 'false' WHERE key = 'video_ad_enabled'");
        await db.query("UPDATE site_settings SET value = '' WHERE key = 'video_ad_url'");

        res.json({ message: 'Publicité vidéo supprimée' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
