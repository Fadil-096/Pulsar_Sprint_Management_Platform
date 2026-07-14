const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").then(res => { console.table(res.rows); pool.end(); }).catch(console.error);
