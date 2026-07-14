const dbLite = require('better-sqlite3')('db/nokia_sprint.db');
const { Client } = require('pg');

async function run() {
  const pgClient = new Client('postgresql://postgres@localhost:5432/nokia_sprint_db');
  await pgClient.connect();
  const rows = dbLite.prepare('SELECT * FROM sprint_members').all();
  for (const r of rows) {
    try {
      await pgClient.query(
        "INSERT INTO sprint_members (id, sprint_id, user_id, role, estimated_hours, spent_hours, joined_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [r.id, r.sprint_id, r.user_id, r.role || '', r.estimated_hours || 0, r.spent_hours || 0, r.joined_at]
      );
    } catch(e) {
      if (!e.message.includes('violates foreign key constraint')) {
        console.error('Error on row:', r.id, e.message);
      }
    }
  }
  await pgClient.query("SELECT setval('sprint_members_id_seq', (SELECT MAX(id) FROM sprint_members))");
  await pgClient.end();
  console.log('Done migrating sprint_members');
}
run();
