/*
  Logging Middleware
  Sends structured logs to the evaluation service.
  Used across backend and frontend.
*/

const EVAL_BASE_URL = process.env.EVAL_API_URL || "http://localhost:8080";

let authToken = null;
let clientId = null;
let clientSecret = null;

async function register() {
  try {
    const res = await fetch(`${EVAL_BASE_URL}/evaluation-service/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "campus-notify" }),
    });
    const data = await res.json();
    clientId = data.clientID || data.clientId;
    clientSecret = data.clientSecret;
    console.log("[logger] registered with eval service");
    return data;
  } catch (err) {
    console.warn("[logger] registration failed, logs go to console:", err.message);
    return null;
  }
}

async function authenticate() {
  if (!clientId || !clientSecret) {
    const r = await register();
    if (!r) return null;
  }
  try {
    const res = await fetch(`${EVAL_BASE_URL}/evaluation-service/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientID: clientId, clientSecret: clientSecret }),
    });
    const data = await res.json();
    authToken = data.token || data.accessToken;
    console.log("[logger] authenticated");
    return authToken;
  } catch (err) {
    console.warn("[logger] auth failed:", err.message);
    return null;
  }
}

async function setupLogger() {
  await register();
  if (clientId && clientSecret) {
    await authenticate();
  }
}

async function Log(stack, level, pkg, message) {
  const payload = { stack, level, package: pkg, message };

  // always log to console as fallback
  const tag = `[${level.toUpperCase()}] [${stack}/${pkg}]`;
  if (level === "error" || level === "fatal") {
    console.error(`${tag} ${message}`);
  } else if (level === "warn") {
    console.warn(`${tag} ${message}`);
  } else {
    console.log(`${tag} ${message}`);
  }

  // send to eval service (fire and forget)
  try {
    const headers = { "Content-Type": "application/json" };
    if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

    await fetch(`${EVAL_BASE_URL}/evaluation-service/logs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (_) {
    // eval service down, no big deal
  }
}

module.exports = { Log, setupLogger, register, authenticate };
