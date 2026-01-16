const db = require('./src/database');
const fs = require('fs');
const users = db.prepare("SELECT id, email, role FROM users").all();
const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC").all();
const settings = db.prepare("SELECT * FROM site_settings").all();

const report = {
    users,
    notifications,
    settings
};

fs.writeFileSync('full_db_report.json', JSON.stringify(report, null, 2));
console.log("Full report written to full_db_report.json");
