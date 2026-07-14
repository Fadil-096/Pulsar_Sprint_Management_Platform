const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

const sqliteDb = new Database(path.join(__dirname, 'db', 'nokia_sprint.db'));

const pgClient = new Client({
  connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db',
});

async function migrate() {
  await pgClient.connect();
  console.log('Connected to PostgreSQL.');

  // Create Schema in PostgreSQL
  console.log('Creating schema in PostgreSQL...');
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK( role IN ('manager', 'employee') ) NOT NULL,
      status TEXT DEFAULT 'active',
      department TEXT DEFAULT '',
      designation TEXT DEFAULT '',
      joining_date TEXT DEFAULT '',
      phone TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS projects (
      project_id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'planning'
    );

    CREATE TABLE IF NOT EXISTS sprints (
      sprint_id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      goal TEXT,
      status TEXT DEFAULT 'planner'
    );

    CREATE TABLE IF NOT EXISTS backlog_items (
      item_id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(project_id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'task',
      priority TEXT DEFAULT 'medium',
      story_points INTEGER,
      status TEXT DEFAULT 'backlog',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      task_id SERIAL PRIMARY KEY,
      sprint_id INTEGER REFERENCES sprints(sprint_id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assignee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      story_points INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      feature_id TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      subtask_id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      completed_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS time_logs (
      log_id SERIAL PRIMARY KEY,
      task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      time_spent INTEGER NOT NULL,
      log_date TEXT DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS team_members (
      sprint_id INTEGER REFERENCES sprints(sprint_id) ON DELETE CASCADE,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      PRIMARY KEY (sprint_id, employee_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      UNIQUE(employee_id, date)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id SERIAL PRIMARY KEY,
      employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      leave_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
      manager_remark TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
      notify_queries INTEGER DEFAULT 1,
      notify_leaves INTEGER DEFAULT 1,
      notify_sprints INTEGER DEFAULT 1,
      notify_system INTEGER DEFAULT 1,
      delivery_inapp INTEGER DEFAULT 1,
      delivery_email INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sprint_notes (
      note_id SERIAL PRIMARY KEY,
      sprint_id INTEGER REFERENCES sprints(sprint_id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      attachment_id SERIAL PRIMARY KEY,
      sprint_id INTEGER REFERENCES sprints(sprint_id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
      uploader_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Schema created.');

  // Migrate Data
  const tables = [
    'employees', 'projects', 'sprints', 'backlog_items', 'tasks',
    'subtasks', 'time_logs', 'team_members', 'attendance', 'leaves',
    'user_settings', 'sprint_notes', 'attachments'
  ];

  for (const table of tables) {
    console.log(`Migrating table: ${table}...`);
    let rows;
    try {
        rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
    } catch(e) {
        console.log(`  Table ${table} might not exist in sqlite, skipping...`);
        continue;
    }
    if (rows.length === 0) {
      console.log(`  No data for ${table}.`);
      continue;
    }

    const columns = Object.keys(rows[0]);
    
    for (const row of rows) {
      const values = columns.map(col => {
        let val = row[col];
        return val;
      });

      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      try {
        await pgClient.query(query, values);
      } catch (err) {
        console.error(`Error inserting into ${table}:`, err.message);
        console.error('Row data:', row);
      }
    }
    console.log(`  Migrated ${rows.length} rows for ${table}.`);

    // Reset sequences for tables with auto-incrementing IDs
    if (table !== 'team_members') {
      let pk = 'id';
      if (table === 'projects') pk = 'project_id';
      if (table === 'sprints') pk = 'sprint_id';
      if (table === 'backlog_items') pk = 'item_id';
      if (table === 'tasks') pk = 'task_id';
      if (table === 'subtasks') pk = 'subtask_id';
      if (table === 'time_logs') pk = 'log_id';
      if (table === 'sprint_notes') pk = 'note_id';
      if (table === 'attachments') pk = 'attachment_id';
      if (table === 'user_settings') pk = 'user_id'; 
      
      if (table !== 'user_settings') {
        try {
            await pgClient.query(`SELECT setval(pg_get_serial_sequence('${table}', '${pk}'), (SELECT COALESCE(MAX(${pk}), 1) FROM ${table}) + 1)`);
        } catch (e) {
            console.error(`Failed to set sequence for ${table}: ${e.message}`);
        }
      }
    }
  }

  // Verification checks
  console.log('\\n--- Verification Checks ---');
  for (const table of tables) {
    try {
        const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
        const pgCount = (await pgClient.query(`SELECT COUNT(*) FROM ${table}`)).rows[0].count;
        console.log(`${table}: SQLite=${sqliteCount}, Postgres=${pgCount} -> ${sqliteCount == pgCount ? 'PASS' : 'FAIL'}`);
    } catch(e) {}
  }

  console.log('Migration completed successfully.');
  await pgClient.end();
  sqliteDb.close();
}

migrate().catch(console.error);
