const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/authMiddleware');

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[Auth] Login attempt for: ${email}`);

    if (!email || !password) {
        return res.status(400).json({ error: 'Identifier and password are required' });
    }

    try {
        const trimmedEmail = email.trim();
        const { rows: userRows } = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [trimmedEmail]);
        const user = userRows[0];

        if (!user) {
            console.log(`[Auth] ❌ User not found: "${trimmedEmail}"`);
            return res.status(401).json({ error: 'Identifiants invalides (Utilisateur non trouvé)' });
        }

        console.log(`[Auth] User found: ${user.id}, Role: ${user.role}`);

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log(`[Auth] ❌ Invalid password for: ${trimmedEmail}`);
            return res.status(401).json({ error: 'Identifiants invalides (Mot de passe incorrect)' });
        }

        // Check if school is suspended (only for non-superadmins)
        if (!user.is_superadmin && user.school_id) {
            const { rows: schoolRows } = await db.query('SELECT status FROM schools WHERE id = $1', [user.school_id]);
            const school = schoolRows[0];
            if (school && school.status === 'suspended') {
                return res.status(403).json({ error: 'Votre école a été suspendue. Veuillez contacter l\'administrateur du site.' });
            }
        }

        let schoolName = 'Global';
        if (user.school_id) {
            const { rows: snRows } = await db.query('SELECT name FROM schools WHERE id = $1', [user.school_id]);
            if (snRows[0]) schoolName = snRows[0].name;
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                school_id: user.school_id,
                is_superadmin: !!user.is_superadmin
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                school_id: user.school_id,
                is_superadmin: !!user.is_superadmin,
                school_name: schoolName
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const upload = require('../middleware/uploadMiddleware');

// Register School & Admin
router.post('/register-school', upload.single('logo'), async (req, res) => {
    const { schoolName, schoolAddress, schoolEmail, schoolPhone, adminName, adminEmail, password } = req.body;

    if (!schoolName || !adminEmail || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows: existingUserRows } = await db.query('SELECT id, role FROM users WHERE email = $1', [adminEmail]);
        const existingUser = existingUserRows[0];
        if (existingUser) {
            return res.status(400).json({ error: `Email '${adminEmail}' is already in use (Role: ${existingUser.role})` });
        }

        // Generate Unique Code
        const code = `SCH-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

        // Get logo URL if uploaded
        const logo_url = req.file ? `/uploads/schools/${req.file.filename}` : null;

        // Transactional insertion (manually handled)
        // 1. Create School
        const { rows: schoolRows } = await db.query(
            'INSERT INTO schools (name, address, email, phone, unique_code, logo_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [schoolName, schoolAddress || '', schoolEmail || '', schoolPhone || '', code, logo_url]
        );
        const schoolId = schoolRows[0].id;

        // 2. Create Admin User
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (school_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
            [schoolId, adminName, adminEmail, hash, 'admin']
        );

        res.json({ success: true, message: 'School created successfully', schoolCode: code });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Link Student (Parent only) - Using NSI
router.post('/link-student', async (req, res) => {
    // Expects Authorization header with token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const { schoolCode, nsi } = req.body;
    if (!schoolCode || !nsi) {
        return res.status(400).json({ error: 'Code École et NSI sont requis' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'parent') {
            return res.status(403).json({ error: 'Seuls les parents peuvent lier des élèves' });
        }

        const { rows: schoolRows } = await db.query('SELECT id, status FROM schools WHERE unique_code = $1', [schoolCode]);
        const school = schoolRows[0];
        if (!school) {
            return res.status(404).json({ error: 'Code École invalide' });
        }

        if (school.status === 'suspended') {
            return res.status(403).json({ error: 'Cette école est actuellement suspendue.' });
        }

        const { rows: studentRows } = await db.query('SELECT id, parent_id, name FROM students WHERE school_id = $1 AND nsi = $2', [school.id, nsi]);
        const student = studentRows[0];
        if (!student) {
            return res.status(404).json({ error: 'Aucun élève trouvé avec ce NSI dans cette école' });
        }

        // Optional: Check if already linked
        if (student.parent_id && student.parent_id !== decoded.id) {
            return res.status(400).json({ error: 'Cet élève est déjà lié à un autre compte parent' });
        }

        await db.query('UPDATE students SET parent_id = $1 WHERE id = $2', [decoded.id, student.id]);

        console.log(`[Auth] ✅ Parent ${decoded.email} linked to student ${student.name} (NSI: ${nsi})`);

        res.json({ success: true, message: 'Élève lié avec succès', studentName: student.name });

    } catch (error) {
        console.error('Link student error:', error);
        res.status(500).json({ error: 'Échec de liaison. ' + error.message });
    }
});

// Register Parent
router.post('/register-parent', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows: existingUserRows } = await db.query('SELECT id, role FROM users WHERE email = $1', [email]);
        const existingUser = existingUserRows[0];
        if (existingUser) {
            return res.status(400).json({ error: `Email '${email}' is already in use (Role: ${existingUser.role})` });
        }

        const hash = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
            [name, email, hash, 'parent']
        );

        res.json({ success: true, message: 'Parent account created successfully' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Profile (Email and/or Password)
router.put('/update-profile', authenticateToken, async (req, res) => {
    const { email, password, name, currentPassword } = req.body;
    const userId = req.user.id;

    try {
        // 1. Verify current password first for security
        if (password || email) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Le mot de passe actuel est requis pour changer l\'email ou le mot de passe.' });
            }

            const { rows: userRows } = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
            const user = userRows[0];

            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
            }
        }

        let updateFields = [];
        let queryParams = [];
        let counter = 1;

        if (email) {
            const trimmedEmail = email.trim();
            // Check if email already exists for another user
            const { rows: existingUser } = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2', [trimmedEmail, userId]);
            if (existingUser.length > 0) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte.' });
            }
            updateFields.push(`email = $${counter++}`);
            queryParams.push(trimmedEmail);
        }

        if (password) {
            const hash = await bcrypt.hash(password, 10);
            updateFields.push(`password = $${counter++}`);
            queryParams.push(hash);
        }

        if (name) {
            updateFields.push(`name = $${counter++}`);
            queryParams.push(name);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Aucun champ à mettre à jour.' });
        }

        queryParams.push(userId);
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${counter} RETURNING id, name, email, role, school_id`;
        const { rows } = await db.query(query, queryParams);

        console.log(`[Auth] Profile updated for user ${userId}`);

        res.json({
            success: true,
            user: {
                id: rows[0].id,
                name: rows[0].name,
                email: rows[0].email,
                role: rows[0].role,
                school_id: rows[0].school_id
            },
            message: 'Profil mis à jour avec succès.'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
    }
});

module.exports = router;

