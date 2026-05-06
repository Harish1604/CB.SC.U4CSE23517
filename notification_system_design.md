# Campus Notification System - Design Doc

## Stage 1: API Design
Endpoints for handling student notifications.

- `GET /notifications`: Get all notifs. Filters: `studentId`, `type`, `isRead`.
- `GET /notifications/priority`: Top N unread notifications.
- `POST /notifications`: Create new (Admin).
- `PATCH /notifications/:id/read`: Mark one as read.
- `PATCH /notifications/batch-read`: Mark many as read.

**Headers:** 
- `Authorization: Bearer <token>` (For protected logging/admin APIs)
- `Content-Type: application/json`

**Real-time:** Using **SSE (Server-Sent Events)**. It's much simpler than WebSockets for one-way server-to-client updates and handles reconnection automatically.

---

## Stage 2: Database Design
Using **SQL (SQLite/PostgreSQL)**. 
**Why:** The data is relational (students linked to notifs). We need strict ordering by timestamp and efficient filtering by type/student, which SQL indexes handle perfectly.

**Schema:**
- `students`: `id (PK)`, `name`, `email`, `department`
- `notifications`: `id (PK)`, `student_id (FK)`, `type` (Placement/Result/Event), `message`, `is_read`, `priority`, `created_at`

**Logging Points:**
- `Log("backend", "info", "db", "Database connection established")`
- `Log("backend", "error", "db", "Query failure: [error message]")`

**Scaling:**
- Use **Table Partitioning** by `created_at` (monthly) to keep indexes small.
- Implement **Read Replicas** to handle high fetch traffic.

---

## Stage 3: Query Optimization
**Problem:** `SELECT *` without indexes causes full table scans, which is slow on millions of rows.

**Optimized Query:**
```sql
SELECT id, type, message, created_at 
FROM notifications 
WHERE student_id = 1042 AND is_read = 0 
ORDER BY created_at ASC;
```
**Index Strategy:** 
`CREATE INDEX idx_notif_student_unread ON notifications(student_id, is_read, created_at ASC);`

**Query for students with placement notifs (Last 7 days):**
```sql
SELECT DISTINCT s.name, s.email 
FROM students s 
JOIN notifications n ON s.id = n.student_id 
WHERE n.type = 'Placement' AND n.created_at >= date('now', '-7 days');
```

---

## Stage 4: Performance Fix
- **Pagination:** Use `LIMIT` and `OFFSET` in the API to avoid loading thousands of rows at once.
- **Caching:** Store the "Priority Inbox" or recent feed in **Redis** with a 60s TTL.
- **Lazy Loading:** Frontend fetches data only when the user scrolls to the bottom.

---

## Stage 5: System Redesign
**Problem:** The current flow (`send_email -> save_to_db -> push`) is synchronous. If the email service hangs, the notification is never saved or pushed.

**Fix:** Use an **Async Message Queue (RabbitMQ)**.
1. API saves to DB immediately.
2. API publishes a "NotificationCreated" event to RabbitMQ.
3. Separate **Workers** subscribe to the queue to send emails and push notifications independently.
**Reliability:** If a worker fails, the message stays in the queue for a retry.

---

## Stage 6: Priority Inbox (Logic)
Implemented in `backend/services/priorityInbox.js`.
- Priority weights: Placement (1) > Result (2) > Event (3).
- Sort logic: Compare by weight first, then by `createdAt` (newest first).
- Returns the top N items for the user's dashboard.

---

## Stage 7: Frontend
React app running on port 3000.
- **State:** `useState` for notifications and filter type.
- **Real-time:** `useEffect` sets up an `EventSource` (SSE) listener.
- **Mobile View:** Uses CSS flex-direction toggle and media queries for smaller screens.
- **Logging:** Calls `Log("frontend", "info", "component", "...")` on user actions like filtering or marking read.
