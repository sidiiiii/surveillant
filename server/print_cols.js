const db = require('./src/database');

async function check() {
    try {
        const { rows } = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'schools'");
        rows.forEach(r => console.log('COL:' + r.column_name));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
