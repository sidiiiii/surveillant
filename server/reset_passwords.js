
const { pool } = require('./src/database');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
    try {
        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const emails = ['elwevacommerce@gmail.com', 'abdelkadermed23@gmail.com'];

        for (const email of emails) {
            const res = await pool.query(
                'UPDATE users SET password = $1 WHERE email = $2 RETURNING *',
                [hashedPassword, email]
            );

            if (res.rows.length > 0) {
                console.log(`Password updated for ${email}`);
            } else {
                console.log(`User not found: ${email}`);
            }
        }
    } catch (err) {
        console.error('Error resetting passwords:', err);
    } finally {
        await pool.end();
    }
}

resetPasswords();
