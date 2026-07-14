const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
Promise.all([
  pool.query('SELECT * FROM employees WHERE name ILIKE \'%Sami%\''),
  pool.query('SELECT * FROM tasks WHERE task_title ILIKE \'%Build the login page%\'')
]).then(([emp, task]) => {
  console.log('Employee:', emp.rows);
  console.log('Task:', task.rows);
  process.exit(0);
}).catch(console.error);
