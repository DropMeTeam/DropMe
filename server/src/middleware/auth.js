// server/src/middleware/auth.js
import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

function getTokenFromCookies(req) {
  return req.cookies?.client_token || req.cookies?.token || null;
}

function getTokenFromHeader(req) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

export function requireAuth(req, _res, next) {
  try {
    // ✅ cookie OR bearer
    const token = getTokenFromHeader(req) || getTokenFromCookies(req);
    if (!token) throw new HttpError(401, "Not authenticated");

    const decoded = verifyToken(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, role, email, name }
    next();
  } catch (e) {
    next(new HttpError(401, "Invalid or expired session"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
    next();
  };
}