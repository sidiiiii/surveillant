const db = require('./src/database');

try {
    console.log("Dropping notifications table...");
    db.exec("DROP TABLE IF EXISTS notifications");

    console.log("Recreating notifications table...");
    db.exec(`
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);

    const info = db.prepare("PRAGMA table_info('notifications')").all();
    console.log("New Schema:", info.map(c => c.name));

    // Test Insert
    console.log("Testing insert...");
    const parent = db.prepare("SELECT id FROM users WHERE role='parent' LIMIT 1").get();
    if (parent) {
        db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)').run(parent.id, "Test Msg");
        console.log("Insert successful!");
    } else {
        console.log("No parent to test insert.");
    }

} catch (e) {
    console.error("FATAL ERROR:", e.message);
}
