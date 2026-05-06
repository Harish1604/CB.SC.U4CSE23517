const express = require('express');
const { getDb } = require('../db/init');
const { getTopPriority } = require('../services/priorityInbox');
const { Log } = require('../../logging_middleware');

const router = express.Router();

function formatNotif(row) {
  return {
    id: row.id,
    student_id: row.student_id,
    type: row.type,
    message: row.message,
    isRead: row.is_read === 1,
    priority: row.priority,
    createdAt: row.created_at
  };
}

// GET /notifications
router.get('/', (req, res) => {
  const db = getDb();
  const { studentId, type, isRead, limit = 50, offset = 0 } = req.query;

  let sql = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];

  if (studentId) { sql += ' AND student_id = ?'; params.push(Number(studentId)); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (isRead !== undefined) { sql += ' AND is_read = ?'; params.push(isRead === 'true' ? 1 : 0); }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  try {
    const rows = db.prepare(sql).all(...params);
    Log("backend", "info", "controller", `fetched ${rows.length} notifications`);
    res.json({ success: true, count: rows.length, data: rows.map(formatNotif) });
  } catch (err) {
    Log("backend", "error", "controller", `fetch failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'failed to fetch notifications' });
  }
});

// GET /notifications/priority
router.get('/priority', (req, res) => {
  const db = getDb();
  const { studentId, limit = 5 } = req.query;

  let sql = 'SELECT * FROM notifications WHERE is_read = 0';
  const params = [];
  if (studentId) { sql += ' AND student_id = ?'; params.push(Number(studentId)); }
  sql += ' ORDER BY created_at DESC';

  try {
    const rows = db.prepare(sql).all(...params);
    const formatted = rows.map(formatNotif);
    const prioritized = getTopPriority(formatted, Number(limit));
    Log("backend", "info", "service", `priority inbox returned ${prioritized.length} items`);
    res.json({ success: true, count: prioritized.length, data: prioritized });
  } catch (err) {
    Log("backend", "error", "service", `priority inbox failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'priority fetch failed' });
  }
});

// GET /notifications/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  try {
    const row = db.prepare('SELECT * FROM notifications WHERE id = ?').get(Number(req.params.id));
    if (!row) return res.status(404).json({ success: false, error: 'not found' });
    res.json({ success: true, data: formatNotif(row) });
  } catch (err) {
    Log("backend", "error", "controller", `fetch by id failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'fetch failed' });
  }
});

// POST /notifications
router.post('/', (req, res) => {
  const db = getDb();
  const { studentId, type, message, priority = 3 } = req.body;

  if (!studentId || !type || !message) {
    return res.status(400).json({ success: false, error: 'studentId, type, message required' });
  }
  if (!['Placement', 'Event', 'Result'].includes(type)) {
    return res.status(400).json({ success: false, error: 'type must be Placement, Event, or Result' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO notifications (student_id, type, message, priority) VALUES (?, ?, ?, ?)'
    ).run(Number(studentId), type, message, Number(priority));

    const created = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
    Log("backend", "info", "controller", `created notification id=${created.id} type=${type}`);

    const broadcast = req.app.get('broadcastToStudent');
    if (broadcast) broadcast(studentId, formatNotif(created));

    res.status(201).json({ success: true, data: formatNotif(created) });
  } catch (err) {
    Log("backend", "error", "controller", `create failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'create failed' });
  }
});

// PATCH /notifications/:id/read
router.patch('/:id/read', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  try {
    const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'not found' });
    Log("backend", "info", "controller", `marked notification ${id} as read`);
    res.json({ success: true, data: { id, isRead: true } });
  } catch (err) {
    Log("backend", "error", "controller", `mark read failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'update failed' });
  }
});

// PATCH /notifications/batch-read
router.patch('/batch-read', (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'provide array of ids' });
  }
  try {
    const ph = ids.map(() => '?').join(', ');
    const result = db.prepare(`UPDATE notifications SET is_read = 1 WHERE id IN (${ph})`).run(...ids.map(Number));
    Log("backend", "info", "controller", `batch read ${result.changes} notifications`);
    res.json({ success: true, updatedCount: result.changes });
  } catch (err) {
    Log("backend", "error", "controller", `batch read failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'batch update failed' });
  }
});

// DELETE /notifications/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  try {
    const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ success: false, error: 'not found' });
    Log("backend", "info", "controller", `deleted notification ${id}`);
    res.json({ success: true, message: 'deleted' });
  } catch (err) {
    Log("backend", "error", "controller", `delete failed: ${err.message}`);
    res.status(500).json({ success: false, error: 'delete failed' });
  }
});

module.exports = router;
