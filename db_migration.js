const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db'
});

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        reminder_date TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("calendar_reminders table created successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
