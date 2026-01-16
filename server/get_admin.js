const db = require('./src/database');

async function getAdmin() {
    try {
        const { rows } = await db.query("SELECT email, password, role, school_id FROM users WHERE role='admin' LIMIT 1");
        console.log("Admin User:", rows[0]);
    } catch (err) {
        console.error(err);
    }
}

getAdmin();
