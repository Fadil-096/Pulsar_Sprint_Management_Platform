const fs = require('fs');
const file = 'client/src/pages/shared/ProjectDetail.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/\\\$\{/g, '${');
fs.writeFileSync(file, code);
