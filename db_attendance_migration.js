const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db'
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        check_in_time TEXT,
        check_out_time TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("attendance_logs table created successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
