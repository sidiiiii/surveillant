const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Helper to generate a unique 5-digit NSI
const generateUniqueNSI = async () => {
    while (true) {
        const nsi = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits
        const { rows } = await db.query('SELECT id FROM students WHERE nsi = $1', [nsi]);
        if (rows.length === 0) return nsi;
    }
};

// Get all students (Admin/Teacher) - Scoped to School
router.get('/', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
    try {
        const { school_id, role, id } = req.user;
        console.log(`[GET /students] ----------------------------------------------------------------`);
        console.log(`[GET /students] Request from User ID: ${id}, Role: ${role}, School ID: ${school_id}`);

        if (!school_id) {
            console.error(`[GET /students] ❌ CRITICAL ERROR: User ${id} has no school_id!`);
            return res.status(403).json({ error: 'School ID missing from token' });
        }

        const query = `
            SELECT s.*, c.name as class_name, u.name as parent_name 
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN users u ON s.parent_id = u.id
            WHERE s.school_id = $1
        `;

        const { rows: students } = await db.query(query, [school_id]);

        console.log(`[GET /students] Found ${students.length} students for School ID ${school_id}`);
        if (students.length > 0) {
            console.log(`[GET /students] First student: ID ${students[0].id}, Name: ${students[0].name}, School ID: ${students[0].school_id}`);
            // Verify integrity
            const foreignStudents = students.filter(s => s.school_id !== school_id);
            if (foreignStudents.length > 0) {
                console.error(`[GET /students] 🚨 DATA LEAK DETECTED! Found ${foreignStudents.length} students from other schools!`);
                console.error(foreignStudents.map(s => ({ id: s.id, name: s.name, school_id: s.school_id })));
            } else {
                console.log(`[GET /students] ✅ Data integrity check passed: All students belong to School ID ${school_id}`);
            }
        }
        console.log(`[GET /students] ----------------------------------------------------------------`);

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json(students);
    } catch (error) {
        console.error(`[GET /students] Error:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Get my children (Parent)
router.get('/my-children', authenticateToken, authorizeRole(['parent']), async (req, res) => {
    try {
        const { rows: children } = await db.query(`
      SELECT s.*, c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.parent_id = $1
    `, [req.user.id]);
        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Student (Admin)
router.post('/', authenticateToken, authorizeRole(['admin']), upload.single('photo'), async (req, res) => {
    const { name, class_id, parent_email, cycle, niveau, serie } = req.body;
    const school_id = req.user.school_id;

    // Validation
    if (!cycle || !niveau) {
        return res.status(400).json({ error: 'Cycle et niveau sont requis' });
    }

    try {
        const bcrypt = require('bcryptjs');
        const { sendEmail } = require('../services/emailService');

        // Generate UNIQUE 5-digit NSI
        const nsi = await generateUniqueNSI();

        // Get photo URL
        const photo_url = req.file ? `/uploads/students/${req.file.filename}` : null;

        // 1. Find or Create Parent
        let parent_id = null;
        let parentCreated = false;
        let parentPassword = null;

        if (parent_email) {
            const { rows: existingParentRows } = await db.query('SELECT id FROM users WHERE email = $1', [parent_email]);
            const existingParent = existingParentRows[0];
            if (existingParent) {
                parent_id = existingParent.id;
                console.log(`[StudentCreate] Parent account already exists: ${parent_email}`);
            } else {
                // Create new Parent with random password
                parentPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
                const hash = await bcrypt.hash(parentPassword, 10);
                const parentName = `Parent de ${name}`;

                const { rows: newParentRows } = await db.query(
                    'INSERT INTO users (school_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                    [school_id, parentName, parent_email, hash, 'parent']
                );
                parent_id = newParentRows[0].id;
                parentCreated = true;

                console.log(`[StudentCreate] ✅ Created parent account: ${parent_email}`);
            }
        }

        // 2. Create Student
        const matricule = `STU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { rows: studentRows } = await db.query(`
            INSERT INTO students (school_id, name, class_id, parent_id, parent_email, matricule, nsi, cycle, niveau, serie, photo_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
        `, [school_id, name, class_id, parent_id, parent_email, matricule, nsi, cycle, niveau, serie || null, photo_url]);

        const newStudentId = studentRows[0].id;

        console.log(`[StudentCreate] ✅ Student created: ${name} (NSI: ${nsi}, ${cycle} ${niveau})`);

        // 3. Send Email (omitted for brevity in this tool call, keeping original logic)
        if (parentCreated && parentPassword) {
            const { rows: schoolInfoRows } = await db.query('SELECT name, unique_code FROM schools WHERE id = $1', [school_id]);
            const schoolInfo = schoolInfoRows[0];
            const niveauDisplay = serie ? `${niveau} Série ${serie}` : niveau;
            const subject = `Compte Parent Créé - ${schoolInfo.name}`;
            const html = `
                <h2>🎓 Bienvenue sur la plateforme scolaire</h2>
                <p>Un compte parent a été créé pour vous afin de suivre la scolarité de <strong>${name}</strong>.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Vos identifiants de connexion :</h3>
                    <p><strong>Email :</strong> ${parent_email}</p>
                    <p><strong>Mot de passe :</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${parentPassword}</code></p>
                </div>

                <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">📝 Informations de l'élève :</h3>
                    <p><strong>Nom :</strong> ${name}</p>
                    <p><strong>NSI :</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${nsi}</code></p>
                    <p><strong>Niveau :</strong> ${cycle} - ${niveauDisplay}</p>
                    <p><strong>Code École :</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px;">${schoolInfo.unique_code}</code></p>
                    <p style="font-size: 14px; color: #666; margin-top: 10px;"><em>Note : L'élève est déjà automatiquement lié à votre compte.</em></p>
                </div>

                <p>Connectez-vous dès maintenant pour :</p>
                <ul>
                    <li>Consulter les notes et bulletins</li>
                    <li>Voir l'assiduité</li>
                    <li>Recevoir des notifications en temps réel</li>
                </ul>

                <p style="margin-top: 30px;"><a href="https://surveillant.it.com/login" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Se connecter</a></p>

                <hr style="margin: 30px 0;"/>
                <p style="color: #666; font-size: 12px;">🔒 Pour votre sécurité, veuillez changer votre mot de passe après la première connexion.</p>
                <p style="color: #666; font-size: 12px;">💡 Conservez précieusement le <strong>NSI</strong> de votre enfant pour accéder à son dossier scolaire.</p>
            `;

            sendEmail(parent_email, subject, html)
                .then(() => console.log(`[StudentCreate] 📧 Email sent to parent: ${parent_email}`))
                .catch(err => console.error(`[StudentCreate] ❌ Email error:`, err));
        }

        res.json({
            id: newStudentId,
            name,
            class_id,
            parent_id,
            parent_email,
            matricule,
            nsi,
            cycle,
            niveau,
            serie,
            photo_url,
            parentAccountCreated: parentCreated
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Student (Admin)
router.put('/:id', authenticateToken, authorizeRole(['admin']), upload.single('photo'), async (req, res) => {
    const { name, class_id, nni, cycle, niveau, serie, parent_email } = req.body;
    const studentId = req.params.id;
    const school_id = req.user.school_id;

    console.log(`[StudentUpdate] Attempting to update student ${studentId} for school ${school_id}`);

    try {
        // Verify student belongs to school
        const { rows: studentRows } = await db.query('SELECT id, parent_id, photo_url FROM students WHERE id = $1 AND school_id = $2', [studentId, school_id]);
        const student = studentRows[0];
        if (!student) {
            console.log(`[StudentUpdate] ❌ Student not found or not in school`);
            return res.status(404).json({ error: 'Élève non trouvé' });
        }

        // If NNI changed, check GLOBAL uniqueness
        if (nni) {
            const { rows: existingNNIRows } = await db.query('SELECT id FROM students WHERE nni = $1 AND id != $2', [nni, studentId]);
            const existingNNI = existingNNIRows[0];
            if (existingNNI) {
                console.log(`[StudentUpdate] ❌ NNI already in use globally: ${nni}`);
                return res.status(400).json({ error: 'Ce NNI est déjà utilisé par un autre élève' });
            }
        }

        // Get photo URL if uploaded, otherwise keep old one
        const photo_url = req.file ? `/uploads/students/${req.file.filename}` : student.photo_url;

        await db.query(`
            UPDATE students 
            SET name = $1, class_id = $2, cycle = $3, niveau = $4, serie = $5, parent_email = $6, photo_url = $7
            WHERE id = $8 AND school_id = $9
        `, [name, class_id || 1, cycle, niveau, serie || null, parent_email, photo_url, studentId, school_id]);

        console.log(`[StudentUpdate] ✅ Success. Student Updated.`);
        res.json({ success: true, message: 'Élève mis à jour avec succès', photo_url });
    } catch (error) {
        console.error(`[StudentUpdate] ❌ Error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Delete Student (Admin)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    const studentId = req.params.id;
    const school_id = req.user.school_id;
    const path = require('path');
    const fs = require('fs');

    console.log(`[StudentDelete] Attempting to delete student ${studentId} for school ${school_id}`);

    const client = await db.pool.connect();

    try {
        // 1. Verify student belongs to school and get photo/docs info
        const { rows: studentRows } = await client.query('SELECT id, photo_url, nsi FROM students WHERE id = $1 AND school_id = $2', [studentId, school_id]);
        const student = studentRows[0];
        if (!student) {
            console.log(`[StudentDelete] ❌ Student not found or not in school`);
            return res.status(404).json({ error: 'Élève non trouvé' });
        }

        const studentNSI = student.nsi;

        // 2. Get all documents to delete physical files
        const { rows: docRows } = await client.query('SELECT file_url FROM student_documents WHERE student_id = $1', [studentId]);

        // Start Transaction
        await client.query('BEGIN');

        // Delete physical photo
        if (student.photo_url) {
            const photoPath = path.join(__dirname, '../..', student.photo_url);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
                console.log(`[StudentDelete] Deleted student photo: ${photoPath}`);
            }
        }

        // Delete physical documents
        docRows.forEach(doc => {
            const docPath = path.join(__dirname, '../..', doc.file_url);
            if (fs.existsSync(docPath)) {
                fs.unlinkSync(docPath);
                console.log(`[StudentDelete] Deleted document file: ${docPath}`);
            }
        });

        // Delete DB records (Cascade handles some, but we do others manually for safety)
        const docsRes = await client.query('DELETE FROM student_documents WHERE student_id = $1', [studentId]);
        const gradesRes = await client.query('DELETE FROM grades WHERE student_id = $1', [studentId]);
        const attendanceRes = await client.query('DELETE FROM attendance WHERE student_id = $1', [studentId]);
        const studentRes = await client.query('DELETE FROM students WHERE id = $1 AND school_id = $2', [studentId, school_id]);

        console.log(`[StudentDelete] Deleted student ${studentNSI} and related records (Grades: ${gradesRes.rowCount}, Attendance: ${attendanceRes.rowCount}, Docs: ${docsRes.rowCount})`);

        await client.query('COMMIT');

        console.log(`[StudentDelete] ✅ Success`);
        res.json({ success: true, message: 'Élève et toutes ses données (incluant NSI et fichiers) supprimés avec succès' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[StudentDelete] ❌ Error:`, error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
