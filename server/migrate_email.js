const db = require('./src/database');

try {
    console.log('Migrating database...');
    db.prepare('ALTER TABLE schools ADD COLUMN email TEXT').run();
    console.log('Migration successful: Added email column to schools table.');
} catch (error) {
    if (error.message.includes('duplicate column name')) {
        console.log('Column already exists.');
    } else {
        console.error('Migration failed:', error);
    }
}
