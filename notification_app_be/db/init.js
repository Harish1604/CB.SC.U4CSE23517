const Database = require('better-sqlite3');
const path = require('path');
const { Log } = require('../../logging_middleware');

const DB_PATH = path.join(__dirname, '..', 'campus_notifications.db');
let db;

function getDb() {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Placement', 'Event', 'Result')),
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      priority INTEGER DEFAULT 3,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_notif_student_read_time
      ON notifications (student_id, is_read, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notif_type_time
      ON notifications (type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notif_student_priority
      ON notifications (student_id, priority ASC, created_at DESC);
  `);

  Log("backend", "info", "db", "database initialized and tables created");
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
    Log("backend", "info", "db", "database connection closed");
  }
}

module.exports = { getDb, closeDb };
