const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'school.db');
const db = new Database(dbPath);

console.log('Adding phone column to schools table...');

try {
    db.prepare('ALTER TABLE schools ADD COLUMN phone TEXT').run();
    console.log('Migration successful: phone column added.');
} catch (err) {
    if (err.message.includes('duplicate column name')) {
        console.log('Migration skipped: phone column already exists.');
    } else {
        console.error('Migration failed:', err);
    }
}
