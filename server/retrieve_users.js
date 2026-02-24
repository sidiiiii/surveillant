
const { pool } = require('./src/database');

async function getUsers() {
    try {
        const emails = ['elwevacommerce@gmail.com', 'abdelkadermed23@gmail.com'];
        const res = await pool.query('SELECT * FROM users WHERE email = ANY($1)', [emails]);
        console.log('Found users:', res.rows.length);
        res.rows.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Password: ${user.password}`);
            console.log(`Role: ${user.role}`);
            console.log('---');
        });
    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        await pool.end();
    }
}

getUsers();
