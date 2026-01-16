const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_me';

const db = require('../database');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        console.log('[Auth] ❌ No token provided');
        return res.status(401).json({ error: 'Access denied, token missing' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.log('[Auth] ❌ Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = decoded;

        // Skip school check for SuperAdmin routes
        const isSuperAdminRoute = req.originalUrl && req.originalUrl.startsWith('/api/superadmin');
        if (isSuperAdminRoute) {
            return next();
        }

        // CRITICAL: Block operations if school is suspended
        // We check this for everyone (including superadmins) if acting on a school-specific route
        if (decoded.school_id) {
            try {
                const { rows } = await db.query('SELECT status FROM schools WHERE id = $1', [decoded.school_id]);
                const school = rows[0];
                const status = school ? school.status : 'NOT_FOUND';

                if (status === 'suspended' && req.method !== 'GET') {
                    console.warn(`[ACL] 🚫 BLOCKED: ${decoded.email} from suspended school ${decoded.school_id} (${req.method} ${req.url})`);
                    return res.status(403).json({
                        error: 'Cette école est suspendue par l\'administrateur du site. Les modifications sont bloquées.'
                    });
                }
            } catch (dbErr) {
                console.error('[ACL] ❌ DB error during status check:', dbErr);
            }
        }

        next();
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole, JWT_SECRET };
