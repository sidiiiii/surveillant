const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const multer = require('multer');

const path = require('path');
const fs = require('fs');

// Configure multer for local document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Seuls les fichiers images (JPEG, PNG, GIF, WEBP) et PDF sont autorisés'));
    }
});

// Get all documents for a student
router.get('/:studentId/documents', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        const { school_id, role, id: userId } = req.user;

        console.log(`[Documents] Request from user ${userId} (role: ${role}) for student ${studentId}`);

        // For parents: verify they are linked to this student
        if (role === 'parent') {
            console.log(`[Documents] Checking parent link: SELECT id FROM students WHERE id = ${studentId} AND parent_id = ${userId}`);
            const { rows: studentRows } = await db.query('SELECT id FROM students WHERE id = $1 AND parent_id = $2', [studentId, userId]);
            const student = studentRows[0];
            console.log(`[Documents] Query result:`, student);
            if (!student) {
                console.log(`[Documents] ❌ Access denied: Parent ${userId} not linked to student ${studentId}`);
                return res.status(403).json({ error: 'Vous n\'avez pas accès aux documents de cet élève' });
            }
            console.log(`[Documents] ✓ Parent ${userId} authorized for student ${studentId}`);
        }
        // For admin/teacher: verify student belongs to their school
        else if (role === 'admin' || role === 'teacher') {
            const { rows: studentRows } = await db.query('SELECT id FROM students WHERE id = $1 AND school_id = $2', [studentId, school_id]);
            const student = studentRows[0];
            if (!student) {
                return res.status(404).json({ error: 'Élève non trouvé' });
            }
        }
        // Other roles are not authorized
        else {
            console.log(`[Documents] ❌ Unauthorized role: ${role}`);
            return res.status(403).json({ error: 'Non autorisé' });
        }

        const { rows: documents } = await db.query(`
            SELECT * FROM student_documents
            WHERE student_id = $1
            ORDER BY created_at DESC
        `, [studentId]);

        console.log(`[Documents] Returning ${documents.length} documents for student ${studentId}`);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload a document for a student
router.post('/:studentId/documents', authenticateToken, authorizeRole(['admin', 'teacher']), upload.single('file'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const { type, description } = req.body;
        const { school_id } = req.user;

        // Verify student belongs to school
        const { rows: studentRows } = await db.query('SELECT id FROM students WHERE id = $1 AND school_id = $2', [studentId, school_id]);
        const student = studentRows[0];
        if (!student) {
            return res.status(404).json({ error: 'Élève non trouvé' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        const file_url = `/uploads/documents/${req.file.filename}`;


        const { rows: result } = await db.query(`
            INSERT INTO student_documents (student_id, type, file_url, description, created_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            RETURNING id
        `, [studentId, type, file_url, description || null]);

        res.json({
            id: result[0].id,
            student_id: studentId,
            type,
            file_url,
            description,
            message: 'Document téléchargé avec succès'
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a document
router.delete('/:studentId/documents/:docId', authenticateToken, authorizeRole(['admin', 'teacher']), async (req, res) => {
    try {
        const { studentId, docId } = req.params;
        const { school_id } = req.user;

        // Verify student belongs to school
        const { rows: studentRows } = await db.query('SELECT id FROM students WHERE id = $1 AND school_id = $2', [studentId, school_id]);
        const student = studentRows[0];
        if (!student) {
            return res.status(404).json({ error: 'Élève non trouvé' });
        }

        // Get document to delete file
        const { rows: docRows } = await db.query('SELECT file_url FROM student_documents WHERE id = $1 AND student_id = $2', [docId, studentId]);
        const document = docRows[0];
        if (!document) {
            return res.status(404).json({ error: 'Document non trouvé' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../..', document.file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await db.query('DELETE FROM student_documents WHERE id = $1 AND student_id = $2', [docId, studentId]);

        res.json({ message: 'Document supprimé avec succès' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
