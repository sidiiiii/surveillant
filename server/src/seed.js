const db = require('./database');
const bcrypt = require('bcryptjs');

const seed = async () => {
    console.log('Seeding database...');

    try {
        // Wait for tables to be created
        await db.initPromise;

        // Clear existing data
        await db.pool.query('TRUNCATE notifications, attendance, grades, students, subjects, classes, users, schools RESTART IDENTITY CASCADE');

        // 1. Create School
        const { rows: schoolRows } = await db.query('INSERT INTO schools (name, address, email) VALUES ($1, $2, $3) RETURNING id', ['École Primaire de Paris', '12 Rue de l\'École', 'contact@ecole-paris.com']);
        const schoolId = schoolRows[0].id;
        console.log(`Created School: ${schoolId}`);

        // 2. Create Users (Admin, Teacher, Parent)
        const passwordHash = await bcrypt.hash('password123', 10);

        await db.query('INSERT INTO users (school_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)', [schoolId, 'Admin Principal', 'admin@school.com', passwordHash, 'admin']);
        await db.query('INSERT INTO users (school_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)', [schoolId, 'Mr. Teacher', 'teacher@school.com', passwordHash, 'teacher']);

        const { rows: parentRows } = await db.query('INSERT INTO users (school_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id', [schoolId, 'John Parent', 'parent@school.com', passwordHash, 'parent']);
        const parentId = parentRows[0].id;

        // 3. Create Classes
        const { rows: classRows } = await db.query('INSERT INTO classes (school_id, name, level) VALUES ($1, $2, $3) RETURNING id', [schoolId, 'CM2', 'Primary']);
        const classId = classRows[0].id;

        // 4. Create Subjects (Linked to School)
        await db.query('INSERT INTO subjects (school_id, name) VALUES ($1, $2)', [schoolId, 'Mathematics']);
        await db.query('INSERT INTO subjects (school_id, name) VALUES ($1, $2)', [schoolId, 'French']);
        await db.query('INSERT INTO subjects (school_id, name) VALUES ($1, $2)', [schoolId, 'Science']);
        await db.query('INSERT INTO subjects (school_id, name) VALUES ($1, $2)', [schoolId, 'History']);

        // 5. Create Student
        // Note: we store parent_email as well for the record
        await db.query('INSERT INTO students (school_id, name, class_id, parent_id, parent_email) VALUES ($1, $2, $3, $4, $5)', [schoolId, 'Alice Student', classId, parentId, 'parent@school.com']);

        console.log('Database seeded successfully with Multi-School structure!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
