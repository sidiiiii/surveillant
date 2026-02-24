const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const smtpUser = 'abdelkadermed06@gmail.com';
    const smtpPass = 'gkkzxotbasptadcy';

    try {
        console.log(`Restoring WORKING SMTP info for all schools...`);
        const result = await pool.query(`
            UPDATE schools 
            SET smtp_host = 'smtp.gmail.com',
                smtp_port = 587,
                smtp_user = $1,
                smtp_pass = $2
        `, [smtpUser, smtpPass]);

        console.log(`Update success! Schools updated: ${result.rowCount}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
