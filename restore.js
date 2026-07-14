const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' }); 
async function seed() { 
  const res = await pool.query('SELECT MIN(id) as id FROM employees'); 
  const e_id = res.rows[0].id; 
  await pool.query("INSERT INTO sprints (sprint_id, sprint_name, sprint_goal, description, priority, status, start_date, end_date, created_by, owner_id) VALUES ('sprint-mock-1', 'Q3 Alpha Release', 'Complete primary components', 'Restored sample sprint', 'high', 'active', '2026-07-01', '2026-07-30', $1, $1)", [e_id]); 
  console.log('Mock sprint restored with employee', e_id); 
} 
seed().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
