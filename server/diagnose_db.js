const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'school.db');
const db = new Database(dbPath);

console.log('--- DIAGNOSIS START ---');

const allStudents = db.prepare(`
    SELECT s.name, s.nni, sc.name as school_name, s.school_id 
    FROM students s 
    JOIN schools sc ON s.school_id = sc.id
    ORDER BY s.school_id
`).all();

console.log(JSON.stringify(allStudents, null, 2));
