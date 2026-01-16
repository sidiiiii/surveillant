const db = require('./src/database');

console.log('Running migration to add unique_code and matricule...');

try {
    // Add unique_code to schools if it doesn't exist
    try {
        // 1. Add column without UNIQUE constraint
        const tableInfo = db.prepare("PRAGMA table_info(schools)").all();
        const hasColumn = tableInfo.some(col => col.name === 'unique_code');

        if (!hasColumn) {
            db.exec('ALTER TABLE schools ADD COLUMN unique_code TEXT');
            console.log('Added unique_code column to schools.');

            // 2. Populate existing schools with a code (if any)
            const schools = db.prepare('SELECT id FROM schools').all();
            for (const school of schools) {
                const code = `SCH-${1000 + school.id}`;
                db.prepare('UPDATE schools SET unique_code = ? WHERE id = ?').run(code, school.id);
            }
            console.log(`Backfilled codes for ${schools.length} schools.`);

            // 3. Add Unique Index
            db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_unique_code ON schools(unique_code)');
            console.log('Created unique index on schools.unique_code.');
        } else {
            console.log('Column unique_code already exists in schools.');
        }
    } catch (err) {
        console.error('Error modifying schools table:', err);
        throw err;
    }

    // Add matricule to students if it doesn't exist
    try {
        const tableInfo = db.prepare("PRAGMA table_info(students)").all();
        const hasColumn = tableInfo.some(col => col.name === 'matricule');

        if (!hasColumn) {
            db.exec('ALTER TABLE students ADD COLUMN matricule TEXT');
            console.log('Added matricule column to students.');

            // Backfill students? Maybe prompt or just leave NULL/generate
            const students = db.prepare('SELECT id FROM students').all();
            for (const student of students) {
                const mat = `STU-${1000 + student.id}`;
                db.prepare('UPDATE students SET matricule = ? WHERE id = ?').run(mat, student.id);
            }
            console.log(`Backfilled matricules for ${students.length} students.`);
        } else {
            console.log('Column matricule already exists in students.');
        }
    } catch (err) {
        console.error('Error modifying students table:', err);
        throw err;
    }

    console.log('Migration completed successfully.');

} catch (error) {
    console.error('Migration failed:', error);
    if (error.code) console.error('Error Code:', error.code);
    if (error.message) console.error('Error Message:', error.message);
}
