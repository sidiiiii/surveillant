const fs = require('fs');
const content = fs.readFileSync('schema_dump.txt', 'utf16le');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i += 50) {
    console.log(lines.slice(i, i + 50).join('\n'));
    console.log('--- CHUNK ---');
}
