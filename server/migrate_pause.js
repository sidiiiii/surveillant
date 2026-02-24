const db = require('./src/database');

async function migrate() {
    try {
        console.log('Adding pause-related columns...');
        await db.query('ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_remaining_ms BIGINT');
        await db.query('ALTER TABLE schools ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE');
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e.message);
    } finally {
        process.exit();
    }
}

migrate();
