const db = require('./src/database');

async function check() {
    try {
        const { rows } = await db.query('SELECT DISTINCT school_id FROM users WHERE role = \'admin\'');
        console.log('Schools with admins:', rows.map(r => r.school_id).join(', '));

        const { rows: schools } = await db.query('SELECT id FROM schools');
        console.log('Schools in table:', schools.map(r => r.id).join(', '));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
