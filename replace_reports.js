const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes("app.get('/api/reports/:sprintId/end-of-sprint'"));
const nextIdx = lines.findIndex(l => l.includes("app.get('/api/reports/employee/:userId'"));

if (startIdx !== -1 && nextIdx !== -1) {
    // We remove everything from startIdx up to nextIdx
    const before = lines.slice(0, startIdx).join('\n');
    const after = lines.slice(nextIdx).join('\n');
    const newCode = before + "\nrequire('./report_generator')(app, db, authMiddleware);\n\n" + after;
    fs.writeFileSync('server.js', newCode);
    console.log('Replaced old endpoints with require("./report_generator")');
} else {
    console.log('Could not find start or next indices', startIdx, nextIdx);
}
