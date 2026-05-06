const express = require('express');
const cors = require('cors');
const { getDb, closeDb } = require('./db/init');
const { requestLogger } = require('./middleware/requestLogger');
const { Log, setupLogger } = require('../logging_middleware');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// SSE connections
const sseClients = new Map();

app.get('/notifications/stream', (req, res) => {
  const studentId = req.query.studentId;
  if (!studentId) {
    return res.status(400).json({ success: false, error: 'studentId required' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('event: connected\ndata: {"status":"connected"}\n\n');

  const sid = String(studentId);
  if (!sseClients.has(sid)) sseClients.set(sid, []);
  sseClients.get(sid).push(res);
  Log("backend", "info", "handler", `SSE connected for student ${sid}`);

  req.on('close', () => {
    const clients = sseClients.get(sid);
    if (clients) {
      const idx = clients.indexOf(res);
      if (idx !== -1) clients.splice(idx, 1);
      if (clients.length === 0) sseClients.delete(sid);
    }
    Log("backend", "info", "handler", `SSE disconnected for student ${sid}`);
  });
});

function broadcastToStudent(studentId, notification) {
  const sid = String(studentId);
  const clients = sseClients.get(sid);
  if (clients && clients.length > 0) {
    const data = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
    clients.forEach(c => c.write(data));
  }
}

app.set('broadcastToStudent', broadcastToStudent);
app.use('/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function start() {
  setupLogger().catch(() => {});
  getDb();
  Log("backend", "info", "route", `server starting on port ${PORT}`);

  app.listen(PORT, () => {
    console.log(`\n  Backend running at http://localhost:${PORT}`);
    console.log(`  Health: http://localhost:${PORT}/health`);
    console.log(`  Notifications: http://localhost:${PORT}/notifications\n`);
  });
}

start();

process.on('SIGINT', () => {
  Log("backend", "info", "config", "shutting down");
  closeDb();
  process.exit(0);
});
