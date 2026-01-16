const db = require('./src/database');
const bcrypt = require('bcryptjs');

async function setup() {
    try {
        const hash = await bcrypt.hash('password123', 10);

        // 1. Ensure a school exists and is ACTIVE first
        const { rows: sRows } = await db.query(
            "INSERT INTO schools (name, unique_code, status) VALUES ('Test Blocking School', 'BLOCK_TEST', 'active') ON CONFLICT (unique_code) DO UPDATE SET status = 'active' RETURNING id"
        );
        const schoolId = sRows[0].id;

        // 2. Create/Update Admin
        await db.query(
            "INSERT INTO users (school_id, name, email, password, role) VALUES ($1, 'Admin Block Test', 'admin_block@test.com', $2, 'admin') ON CONFLICT (email) DO UPDATE SET school_id = $1, password = $2",
            [schoolId, hash]
        );

        console.log('✅ Setup complete: admin_block@test.com / password123');
        console.log('School ID:', schoolId, 'Status: ACTIVE');

    } catch (e) {
        console.error(e);
    }
}
setup();
