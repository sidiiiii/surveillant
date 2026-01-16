const db = require('./src/database');

console.log('=== Migration: Ading Image Support and Fixing NNI ===\n');

try {
    // 1. Schools table: Add logo_url
    try {
        db.exec('ALTER TABLE schools ADD COLUMN logo_url TEXT');
        console.log('✅ Column logo_url added to schools');
    } catch (e) {
        console.log('ℹ️ Column logo_url already exists or error:', e.message);
    }

    // 2. Students table: Add photo_url
    try {
        db.exec('ALTER TABLE students ADD COLUMN photo_url TEXT');
        console.log('✅ Column photo_url added to students');
    } catch (e) {
        console.log('ℹ️ Column photo_url already exists or error:', e.message);
    }

    // 3. Ensure UNIQUE index on NNI cross-school
    try {
        // Drop existing index if it's not unique or named differently
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_students_nni ON students(nni)');
        console.log('✅ Unique index on NNI ensured');
    } catch (e) {
        console.error('❌ Error creating unique index on NNI:', e.message);
        console.log('Checking for duplicates...');
        const duplicates = db.prepare(`
            SELECT nni, COUNT(*) as count 
            FROM students 
            WHERE nni IS NOT NULL 
            GROUP BY nni 
            HAVING count > 1
        `).all();
        if (duplicates.length > 0) {
            console.log('⚠️ Found duplicate NNIs:', duplicates);
        }
    }

    console.log('\n🎉 Migration finished!');
} catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
}
