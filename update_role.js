const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
pool.query("UPDATE employees SET role = 'administrator' WHERE email = 'fadil@arc.com'")
  .then(res => { console.log('Updated', res.rowCount); pool.end(); })
  .catch(e => { console.error('Error:', e.message); pool.end(); });
