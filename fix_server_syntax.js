const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server.js');
let content = fs.readFileSync(file, 'utf8');

// Fix members mapping closing brackets
content = content.replace(/estimatedHours: m\.estimated_hours,\s*tasks: tasks\.map/g, "estimatedHours: m.estimated_hours\n      })),\n      tasks: tasks.map");

// Fix subtasksList mapping closing brackets
content = content.replace(/estimatedHours: st\.estimated_hours,\s*notes: notes\.map/g, "estimatedHours: st.estimated_hours\n        }))\n      })),\n      notes: notes.map");

fs.writeFileSync(file, content);
console.log('server.js syntax fixed');
