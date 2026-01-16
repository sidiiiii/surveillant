const db = require('./src/database');
const results = db.prepare("SELECT name, sql FROM sqlite_master WHERE sql LIKE '%grades%'").all();
console.log(results);
