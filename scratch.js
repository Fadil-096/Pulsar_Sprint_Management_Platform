const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
async function run() {
  await pool.query("ALTER TABLE tasks ALTER COLUMN assigned_to DROP NOT NULL");
  await pool.query("UPDATE tasks SET assigned_to = NULL WHERE sprint_id = 'S10007'");
  pool.end();
}
run().catch(console.error);
