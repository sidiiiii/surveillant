const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        const res = await pool.query('SELECT * FROM schools');
        console.log('--- SCHOOLS ---');
        console.log(JSON.stringify(res.rows, null, 2));

        const res2 = await pool.query('SELECT name, email, role, school_id FROM users WHERE role = \'admin\'');
        console.log('\n--- ADMIN USERS ---');
        console.log(JSON.stringify(res2.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
