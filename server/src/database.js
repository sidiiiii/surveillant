const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuration for local and production (Render/Vercel often provide DATABASE_URL)
// If running locally without DATABASE_URL, you might need to provide individual params (user, host, database, password, port)
// or set a local DATABASE_URL in .env
const connectionString = process.env.DATABASE_URL;

// Coolify internal databases don't use SSL.
// Only enable SSL if the URL explicitly requires it (e.g. external Supabase/Render).
const useSSL = connectionString && connectionString.includes('sslmode=require');

const pool = new Pool({
  connectionString: connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        email TEXT,
        unique_code TEXT UNIQUE,
        logo_url TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active',
        subscription_end_date TIMESTAMP,
        subscription_remaining_ms BIGINT,
        is_paused BOOLEAN DEFAULT FALSE,
        smtp_user TEXT,
        smtp_pass TEXT,
        smtp_host TEXT,
        smtp_port INTEGER
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id),
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'teacher', 'parent')) NOT NULL,
        is_superadmin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id),
        name TEXT NOT NULL,
        level TEXT,
        cycle TEXT,
        niveau TEXT,
        UNIQUE(school_id, name, niveau, cycle)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id),
        name TEXT NOT NULL,
        UNIQUE(school_id, name)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id),
        name TEXT NOT NULL,
        matricule TEXT,
        class_id INTEGER REFERENCES classes(id),
        parent_id INTEGER REFERENCES users(id),
        parent_email TEXT, 
        nsi TEXT UNIQUE,
        cycle TEXT,
        niveau TEXT,
        serie TEXT,
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        subject_id INTEGER NOT NULL REFERENCES subjects(id),
        grade REAL NOT NULL,
        type TEXT,
        period TEXT,
        comment TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id),
        date DATE NOT NULL,
        status TEXT CHECK(status IN ('present', 'absent', 'late', 'absent_8h_10h', 'absent_10h_12h', 'absent_12h_14h')) NOT NULL,
        notification_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT,
        message TEXT NOT NULL,
        media_url TEXT,
        media_type VARCHAR(50),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_documents (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('exercice', 'devoir', 'examen')),
        file_url TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
      );
    `);

    console.log('Tables created or already exist.');
  } catch (err) {
    console.error('Error creating tables:', err);
  }
};

const ensureSuperAdmin = async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE is_superadmin = TRUE');
    if (rows.length === 0) {
      console.log('No superadmin found. Creating default superadmin...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, is_superadmin) VALUES ($1, $2, $3, $4, $5)',
        ['Super Admin', 'superadmin@school.com', hashedPassword, 'admin', true]
      );
      console.log('Default superadmin created: superadmin@school.com / admin123');
    }
  } catch (err) {
    console.error('Error ensuring superadmin:', err);
  }
};

// Initialize tables and default data
const initPromise = (async () => {
  await createTables();
  await ensureSuperAdmin();
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initPromise
};
