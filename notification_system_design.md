# Campus Notification System - Design Doc

## Stage 1: API Design
Endpoints for handling student notifications.

- `GET /notifications`: Get all notifs. Filters: `studentId`, `type`, `isRead`.
- `GET /notifications/priority`: Top N unread.
- `POST /notifications`: Create new (Admin).
- `PATCH /notifications/:id/read`: Mark one as read.
- `PATCH /notifications/batch-read`: Mark many as read.

**Real-time:** Using **SSE (Server-Sent Events)** because it's simpler than WebSockets for one-way server-to-client updates.

---

## Stage 2: Database Design
Using **SQL (SQLite/PostgreSQL)**. 
**Why:** Data is relational (students linked to notifs) and we need strict ordering and filtering.

**Schema:**
- `students`: id, name, email, dept
- `notifications`: id, student_id, type (Placement/Result/Event), message, is_read, priority, created_at

**Scaling:**
- Partitioning tables by month.
- Vertical scaling first, then read replicas.

---

## Stage 3: Query Optimization
**Problem:** `SELECT *` and no indexes makes fetching slow on large data.

**Optimized Query:**
```sql
SELECT id, type, message, created_at 
FROM notifications 
WHERE studentId = 1042 AND isRead = false 
ORDER BY createdAt DESC;
```
**Index:** `CREATE INDEX idx_notif_query ON notifications(studentId, isRead, createdAt DESC);`

**Last 7 days placement notifs:**
```sql
SELECT * FROM notifications 
WHERE type = 'Placement' AND createdAt >= date('now', '-7 days');
```

---

## Stage 4: Performance Fix
- **Pagination:** Don't load everything. Use `LIMIT` and `OFFSET`.
- **Caching:** Store recent notifs in Redis.
- **Lazy Loading:** Frontend only fetches next page when scrolling down.

---

## Stage 5: System Redesign
**Issue:** Sync flow (`email -> db -> push`) is blocking. If email service is slow/fails, everything stops.

**Fix:** Use **Async Message Queue (RabbitMQ/Kafka)**.
1. Save to DB.
2. Push event to queue.
3. Workers pick up from queue and send email/push separately.
**Reliability:** Retries on failure without blocking the main API.

---

## Stage 6: Priority Inbox (Logic)
Implemented in `backend/services/priorityInbox.js`.
1. Assign weight: Placement(1) < Result(2) < Event(3).
2. Sort by weight, then by timestamp (newest first).
3. Return top N.

---

## Stage 7: Frontend
React app on port 3000.
- `useState` for notif list and filters.
- `useEffect` for fetching data and setting up SSE.
- `PriorityInbox` component shows top 3 unread items.
- Simple CSS for mobile/desktop toggle.
