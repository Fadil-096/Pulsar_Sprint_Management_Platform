const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

const sqliteDb = new Database(path.join(__dirname, 'db', 'nokia_sprint.db'));
const pgClient = new Client({
  connectionString: 'postgresql://postgres:batman@localhost:5432/nokia_sprint_db',
});

async function migrate() {
  await pgClient.connect();
  console.log('Connected to PostgreSQL. Clearing schema...');
  await pgClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

  const tablesInfo = sqliteDb.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
  
  // Sort tables to handle foreign keys (basic topological sort based on common references)
  // Or simply disable foreign keys checks in Postgres during schema creation if possible, but PG doesn't have a global toggle.
  // Instead, we'll just extract the create table statements, remove foreign key constraints if needed, or sort them manually.
  // Let's just create them without foreign key constraints for the migration to avoid ordering issues, or manually sort them.
  const order = [
    'employees', 'projects', 'system_settings', 'role_permissions', 'audit_logs',
    'sprints', 'sprint_reviews', 'user_settings',
    'backlog_items', 'project_tasks',
    'tasks', 'subtasks', 'leaves', 'queries', 'notifications',
    'sprint_notes', 'sprint_attachments', 'timer_sessions'
  ];

  for (const tableName of order) {
    const tableInfo = tablesInfo.find(t => t.name.replace(/"/g, '') === tableName);
    if (!tableInfo) continue;

    console.log(`Creating table: ${tableName}`);
    let sql = tableInfo.sql;
    
    // SQLite to Postgres Syntax Fixes
    sql = sql.replace(/AUTOINCREMENT/gi, '');
    sql = sql.replace(/INTEGER\s+PRIMARY\s+KEY/gi, 'SERIAL PRIMARY KEY');
    sql = sql.replace(/\(datetime\('now'\)\)/gi, 'CURRENT_TIMESTAMP');
    sql = sql.replace(/DEFAULT\s+"([^"]*)"/g, "DEFAULT '$1'"); // Fix DEFAULT "..." to DEFAULT '...'
    sql = sql.replace(/"/g, ''); // Remove remaining double quotes (which were for table names like "tasks")
    
    try {
      await pgClient.query(sql);
    } catch (e) {
      console.error(`Failed to create ${tableName}: ${e.message}`);
      console.error(sql);
    }
  }

  // Migrate Data
  for (const tableName of order) {
    console.log(`Migrating data for ${tableName}...`);
    const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      try {
        await pgClient.query(query, values);
      } catch (err) {
        console.error(`Error inserting into ${tableName}:`, err.message);
      }
    }
    console.log(`  Migrated ${rows.length} rows for ${tableName}.`);

    // Reset Sequence
    try {
      await pgClient.query(`SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${tableName}) + 1)`);
    } catch (e) {
      // Ignore if no sequence or 'id' column
    }
  }

  console.log('--- Verification ---');
  for (const tableName of order) {
    try {
        const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
        const pgCount = (await pgClient.query(`SELECT COUNT(*) FROM ${tableName}`)).rows[0].count;
        console.log(`${tableName}: SQLite=${sqliteCount}, Postgres=${pgCount} -> ${sqliteCount == pgCount ? 'PASS' : 'FAIL'}`);
    } catch(e) {}
  }

  await pgClient.end();
  sqliteDb.close();
}

migrate().catch(console.error);
