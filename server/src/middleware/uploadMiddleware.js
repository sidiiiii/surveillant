const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // In production (Coolify), we MUST use /app/uploads to match the persistent volume.
        const IS_PRODUCTION = process.env.NODE_ENV === 'production';
        let dest = IS_PRODUCTION
            ? '/app/uploads'
            : path.join(process.cwd(), 'uploads');

        if (file.fieldname === 'logo') {
            dest = path.join(dest, 'schools');
        } else if (file.fieldname === 'photo') {
            dest = path.join(dest, 'students');
        }

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Get original extension
        let ext = path.extname(file.originalname).toLowerCase();
        // Clean it (keep only dot and alphanumeric)
        ext = ext.replace(/[^.a-z0-9]/g, '');
        // Default to .jpg if missing
        if (!ext) ext = '.jpg';

        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
