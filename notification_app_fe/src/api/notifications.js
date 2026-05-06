const API_BASE = "/notifications";

export async function fetchNotifications(filters = {}) {
  const params = new URLSearchParams();
  if (filters.studentId) params.set("studentId", filters.studentId);
  if (filters.type) params.set("type", filters.type);
  if (filters.isRead !== undefined) params.set("isRead", filters.isRead);

  const res = await fetch(`${API_BASE}?${params.toString()}`);
  const data = await res.json();
  return data;
}

export async function fetchPriorityNotifications(limit = 5, studentId) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (studentId) params.set("studentId", studentId);

  const res = await fetch(`${API_BASE}/priority?${params.toString()}`);
  const data = await res.json();
  return data;
}

export async function markAsRead(id) {
  const res = await fetch(`${API_BASE}/${id}/read`, { method: "PATCH" });
  const data = await res.json();
  return data;
}

// simple frontend logger that mirrors the backend Log function
export function Log(level, pkg, message) {
  const tag = `[${level.toUpperCase()}] [frontend/${pkg}]`;
  if (level === "error") console.error(`${tag} ${message}`);
  else if (level === "warn") console.warn(`${tag} ${message}`);
  else console.log(`${tag} ${message}`);

  // fire and forget to eval service
  fetch("/evaluation-service/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stack: "frontend", level, package: pkg, message }),
  }).catch(() => {});
}
