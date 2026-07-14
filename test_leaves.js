const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });

async function run() {
    const res = await pool.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'leaves_leave_type_check';");
    console.log(res.rows);
    pool.end();
}
run();
