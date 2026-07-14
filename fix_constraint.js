const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db' });

async function run() {
    await pool.query("ALTER TABLE leaves DROP CONSTRAINT leaves_leave_type_check;");
    await pool.query("ALTER TABLE leaves ADD CONSTRAINT leaves_leave_type_check CHECK (leave_type IN ('sick', 'casual', 'planned', 'emergency'));");
    console.log("Constraint updated!");
    pool.end();
}
run();
