const db = require('./src/database');

console.log('Migrating schools table to add SMTP credentials...');

try {
    db.prepare('ALTER TABLE schools ADD COLUMN smtp_user TEXT').run();
    console.log('Added smtp_user column');
} catch (e) {
    if (!e.message.includes('duplicate column')) console.error(e.message);
}

try {
    db.prepare('ALTER TABLE schools ADD COLUMN smtp_pass TEXT').run();
    console.log('Added smtp_pass column');
} catch (e) {
    if (!e.message.includes('duplicate column')) console.error(e.message);
}

try {
    db.prepare('ALTER TABLE schools ADD COLUMN smtp_host TEXT DEFAULT "smtp.gmail.com"').run();
    console.log('Added smtp_host column');
} catch (e) {
    if (!e.message.includes('duplicate column')) console.error(e.message);
}

try {
    db.prepare('ALTER TABLE schools ADD COLUMN smtp_port INTEGER DEFAULT 587').run();
    console.log('Added smtp_port column');
} catch (e) {
    if (!e.message.includes('duplicate column')) console.error(e.message);
}

console.log('Migration complete.');
