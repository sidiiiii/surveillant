const db = require('./src/database');

async function check() {
    try {
        const { rows } = await db.query("SELECT id, name FROM schools");
        console.log(`REAL_COUNT: ${rows.length}`);
        rows.forEach(r => console.log(`SCHOOL: ${r.id} - ${r.name}`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
