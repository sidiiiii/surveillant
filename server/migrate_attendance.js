const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'school.db');
const db = new Database(dbPath);

console.log('Migrating attendance table...');

try {
    // 1. Rename existing table
    db.prepare('ALTER TABLE attendance RENAME TO attendance_old').run();

    // 2. Create new table with updated CHECK constraint
    db.prepare(`
        CREATE TABLE attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date DATE NOT NULL,
            status TEXT CHECK(status IN ('present', 'absent', 'late', 'absent_8h_10h', 'absent_10h_12h', 'absent_12h_14h')) NOT NULL,
            notification_sent BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(student_id) REFERENCES students(id)
        )
    `).run();

    // 3. Copy data from old table
    db.prepare('INSERT INTO attendance (id, student_id, date, status, notification_sent, created_at) SELECT id, student_id, date, status, notification_sent, created_at FROM attendance_old').run();

    // 4. Drop old table
    db.prepare('DROP TABLE attendance_old').run();

    console.log('Migration successful!');
} catch (err) {
    console.error('Migration failed:', err);
    // Try to rollback rename if possible
    try {
        db.prepare('ALTER TABLE attendance_old RENAME TO attendance').run();
    } catch (e) { }
}
