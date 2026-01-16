const db = require('./src/database');

console.log('Running site settings migration...');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS site_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    // Insert default values if not exists
    const hasNews = db.prepare('SELECT 1 FROM site_settings WHERE key = ?').get('global_news');
    if (!hasNews) {
        db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run('global_news', '');
    }

    const hasMaintenance = db.prepare('SELECT 1 FROM site_settings WHERE key = ?').get('maintenance_mode');
    if (!hasMaintenance) {
        db.prepare('INSERT INTO site_settings (key, value) VALUES (?, ?)').run('maintenance_mode', 'false');
    }

    console.log('Site settings migration completed successfully.');
} catch (error) {
    console.error('Migration failed:', error);
}
