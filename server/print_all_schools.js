const db = require('./src/database');

async function check() {
    try {
        const { rows } = await db.query('SELECT * FROM schools');
        console.log('--- ALL SCHOOLS ---');
        rows.forEach(r => {
            console.log(JSON.stringify(r));
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
