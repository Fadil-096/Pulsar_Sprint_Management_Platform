const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'client/src/components/EmployeeDetailDrawer.jsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content);
console.log('EmployeeDetailDrawer.jsx syntax errors fixed');
