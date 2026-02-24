const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting local database migration...');

        // Check if column nni exists in students
        const studentCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' AND column_name = 'nni';
    `);

        if (studentCols.rows.length > 0) {
            console.log('Renaming students.nni to students.nsi...');
            await client.query('ALTER TABLE students RENAME COLUMN nni TO nsi;');
            console.log('Ensuring students.nsi is unique...');
            // Check if unique constraint exists or just add it (catch error if exists)
            try {
                await client.query('ALTER TABLE students ADD CONSTRAINT students_nsi_key UNIQUE (nsi);');
            } catch (e) {
                console.log('Unique constraint might already exist or could not be added:', e.message);
            }
        } else {
            console.log('students.nni not found, checking if students.nsi already exists...');
            const nsiCols = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'nsi';
      `);
            if (nsiCols.rows.length === 0) {
                console.log('Adding students.nsi column...');
                await client.query('ALTER TABLE students ADD COLUMN nsi TEXT UNIQUE;');
            }
        }

        // Ensure schools columns exist
        const schoolCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'schools';
    `);
        const existingSchoolCols = schoolCols.rows.map(r => r.column_name);

        if (!existingSchoolCols.includes('subscription_end_date')) {
            console.log('Adding schools.subscription_end_date...');
            await client.query('ALTER TABLE schools ADD COLUMN subscription_end_date TIMESTAMP;');
        }
        if (!existingSchoolCols.includes('status')) {
            console.log('Adding schools.status...');
            await client.query("ALTER TABLE schools ADD COLUMN status TEXT DEFAULT 'active';");
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

migrate();
