const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const smtpUser = 'meds14099@gmail.com';
    const smtpPass = 'pupo vlbo gjvv yjaw';
    const schoolId = 2; // Ejyal

    try {
        console.log(`Updating SMTP info for school ID ${schoolId}...`);
        const result = await pool.query(`
            UPDATE schools 
            SET smtp_host = 'smtp.gmail.com',
                smtp_port = 587,
                smtp_user = $1,
                smtp_pass = $2
            WHERE id = $3
        `, [smtpUser, smtpPass, schoolId]);

        console.log(`Update success! Row count: ${result.rowCount}`);

        // Also update school 3 if it's empty or needs it
        await pool.query(`
            UPDATE schools 
            SET smtp_host = 'smtp.gmail.com',
                smtp_port = 587,
                smtp_user = $1,
                smtp_pass = $2
            WHERE id = 3
        `, [smtpUser, smtpPass]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
