const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Configuration for local and production (Render/Vercel often provide DATABASE_URL)
// If running locally without DATABASE_URL, you might need to provide individual params (user, host, database, password, port)
// or set a local DATABASE_URL in .env
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
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
        nni TEXT UNIQUE,
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

// Initialize tables
const initPromise = createTables();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initPromise
};
