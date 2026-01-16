const db = require('./src/database');

console.log('Running superadmin migration...');

try {
    // Add status to schools
    try {
        const tableInfo = db.prepare("PRAGMA table_info(schools)").all();
        const hasStatus = tableInfo.some(col => col.name === 'status');

        if (!hasStatus) {
            db.exec("ALTER TABLE schools ADD COLUMN status TEXT DEFAULT 'active'");
            console.log('Added status column to schools.');
        } else {
            console.log('Column status already exists in schools.');
        }
    } catch (err) {
        console.error('Error modifying schools table:', err);
    }

    // Add is_superadmin to users
    try {
        const tableInfo = db.prepare("PRAGMA table_info(users)").all();
        const hasSuperadmin = tableInfo.some(col => col.name === 'is_superadmin');

        if (!hasSuperadmin) {
            db.exec('ALTER TABLE users ADD COLUMN is_superadmin BOOLEAN DEFAULT 0');
            console.log('Added is_superadmin column to users.');
        } else {
            console.log('Column is_superadmin already exists in users.');
        }
    } catch (err) {
        console.error('Error modifying users table:', err);
    }

    // Make the first user a superadmin as a default (or specific email)
    // Let's look for a specific email or just the first user
    const firstUser = db.prepare('SELECT id, email FROM users ORDER BY id ASC LIMIT 1').get();
    if (firstUser) {
        db.prepare('UPDATE users SET is_superadmin = 1 WHERE id = ?').run(firstUser.id);
        console.log(`User ${firstUser.email} is now a superadmin.`);
    }

    console.log('Superadmin migration completed successfully.');

} catch (error) {
    console.error('Migration failed:', error);
}
