const db = require('./src/database');

console.log('Creating student_documents table...');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS student_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('exercice', 'devoir', 'examen')),
            file_url TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    `);

    console.log('✅ Table student_documents created successfully!');
} catch (error) {
    console.error('❌ Error creating table:', error);
}
