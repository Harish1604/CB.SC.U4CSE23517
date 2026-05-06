const { Log } = require('../../logging_middleware');

function requestLogger(req, res, next) {
  const start = Date.now();

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    Log("backend", level, "middleware", msg);
    originalEnd.apply(res, args);
  };

  next();
}

module.exports = { requestLogger };
