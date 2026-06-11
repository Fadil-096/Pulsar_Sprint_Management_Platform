const db = require('better-sqlite3')('db/nokia_sprint.db');

db.prepare(`
  INSERT INTO notifications (recipient_id, sender_id, type, title, message, is_read) 
  VALUES (1, 2, 'query', 'Test Notification', 'This is a test notification generated for checking purposes.', 0)
`).run();

console.log('Test notification added successfully');
