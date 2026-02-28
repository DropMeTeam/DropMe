// src/middleware/errorHandler.js
export default function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || "Server error";

  if (status >= 500) console.error(err);

  return res.status(status).json({ ok: false, message });
}