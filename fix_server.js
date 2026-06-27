const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverPath, 'utf8');

// SQL queries replacements
content = content.replace(/,\s*spent_hours/g, '');
content = content.replace(/sm\.estimated_hours,\s*sm\.spent_hours/g, 'sm.estimated_hours');
content = content.replace(/SUM\(t\.spent_hours\) as totalSpent/g, '0 as totalSpent'); // just keeping totalSpent as 0 in sql to not break object mapping if it depends on it, but we can also just remove it

// JS logic replacements:
// Object property mappings
content = content.replace(/spentHours:\s*[^,]+,/g, '');
content = content.replace(/spentHours:\s*[^}]+/g, '');
content = content.replace(/act:\s*[^,]+,/g, '');
content = content.replace(/var:\s*[^}]+/g, '');

// Reduce functions
content = content.replace(/const totalSpentHours =[^;]+;/g, 'const totalSpentHours = 0;');
content = content.replace(/const totalSpent =[^;]+;/g, 'const totalSpent = 0;');
content = content.replace(/const totalAct =[^;]+;/g, 'const totalAct = 0;');
content = content.replace(/const mAct =[^;]+;/g, 'const mAct = 0;');
content = content.replace(/emp\.totalSpent \+= t\.spent_hours;/g, 'emp.totalSpent += 0;');
content = content.replace(/const dailyAvg =[^;]+;/g, 'const dailyAvg = 0;');

// Update queries:
content = content.replace(/if \(spentHours !== undefined\) { updates\.push\('spent_hours = \?'\); values\.push\(spentHours\); }/g, '');
content = content.replace(/db\.prepare\('UPDATE subtasks SET spent_hours = spent_hours \+ \? WHERE subtask_id = \?'\)\.run\(durationHours, active\.subtask_id\);/g, '');
content = content.replace(/db\.prepare\('UPDATE tasks SET spent_hours = spent_hours \+ \? WHERE task_id = \?'\)\.run\(durationHours, subtask\.task_id\);/g, '');
content = content.replace(/db\.prepare\('UPDATE sprint_members SET spent_hours = spent_hours \+ \? WHERE sprint_id = \? AND user_id = \?'\)\.run\(durationHours, task\.sprint_id, req\.user\.id\);/g, '');

fs.writeFileSync(serverPath, content);
console.log('server.js updated successfully');
