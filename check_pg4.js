const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
async function test() {
  try {
    const res = await pool.query("UPDATE subtasks SET status = 'done', completed_at = CURRENT_TIMESTAMP WHERE subtask_id = 'ST-TEST'");
    console.log(res.rowCount);
  } catch (err) {
    console.error("ERROR 1:", err.message);
  }
  
  try {
    const res2 = await pool.query("SELECT sprint_name FROM sprints WHERE sprint_id = 'test'");
    console.log(res2.rows);
  } catch(e) { console.error(e.message); }
  
  pool.end();
}
test();
