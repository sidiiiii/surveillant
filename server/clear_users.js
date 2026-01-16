const db = require('./src/database');

console.log('Current users:');
const users = db.prepare('SELECT id, name, email, role FROM users').all();
console.table(users);

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('\nDo you want to DELETE ALL users? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
        db.prepare('DELETE FROM users').run();
        console.log('✅ All users deleted.');
    } else {
        console.log('❌ Operation cancelled.');
    }
    readline.close();
});
