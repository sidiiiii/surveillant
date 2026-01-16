const db = require('./src/database');

try {
    // Check if columns exist
    const info = db.prepare("PRAGMA table_info(notifications)").all();
    const columns = info.map(c => c.name);

    if (!columns.includes('media_url')) {
        console.log("Adding media_url column...");
        db.prepare("ALTER TABLE notifications ADD COLUMN media_url TEXT").run();
    } else {
        console.log("media_url already exists.");
    }

    if (!columns.includes('media_type')) {
        console.log("Adding media_type column...");
        db.prepare("ALTER TABLE notifications ADD COLUMN media_type TEXT").run();
    } else {
        console.log("media_type already exists.");
    }

    console.log("Migration complete.");
} catch (error) {
    console.error("Migration failed:", error);
}
