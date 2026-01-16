const db = require('./src/database');

console.log('\n=== Linking Parent to Student ===\n');

try {
    // Find parent user
    const parent = db.prepare('SELECT id, email FROM users WHERE email = ?').get('parent@school.com');
    if (!parent) {
        console.log('❌ Parent user not found!');
        process.exit(1);
    }
    console.log(`✓ Found parent: ${parent.email} (ID: ${parent.id})`);

    // Find student 1
    const student = db.prepare('SELECT id, name, parent_id, nni FROM students WHERE id = 1').get();
    if (!student) {
        console.log('❌ Student ID 1 not found!');
        process.exit(1);
    }
    console.log(`✓ Found student: ${student.name} (ID: ${student.id}, NNI: ${student.nni || 'NULL'})`);

    // Check if already linked
    if (student.parent_id === parent.id) {
        console.log(`✓ Student is already linked to parent ${parent.email}`);
    } else {
        // Link parent to student
        db.prepare('UPDATE students SET parent_id = ? WHERE id = ?').run(parent.id, student.id);
        console.log(`✅ Successfully linked student ${student.name} to parent ${parent.email}`);
    }

    // Verify the link
    const updatedStudent = db.prepare('SELECT id, name, parent_id FROM students WHERE id = 1').get();
    console.log(`\n✓ Verification: Student parent_id = ${updatedStudent.parent_id}`);

} catch (error) {
    console.error('❌ Error:', error.message);
}

console.log('\n=== End ===\n');
