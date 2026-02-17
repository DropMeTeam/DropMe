import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, _res, next) {
  try {
    const cookieToken = req.cookies?.token;

    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7) : null;

    const token = cookieToken || bearerToken;
    if (!token) throw new HttpError(401, "Not authenticated");

    const decoded = verifyToken(token, process.env.JWT_SECRET);

    // Normalize payload shapes:
    // - some apps sign { user: {...} }
    // - some sign { id, role, ... }
    req.user = decoded?.user ?? decoded;

    next();
  } catch (err) {
    next(new HttpError(401, "Invalid or expired session"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    const role =
      req.user?.role ||
      req.user?.type || // fallback if you used 'type'
      (Array.isArray(req.user?.roles) ? req.user.roles[0] : null);

    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    if (!role) return next(new HttpError(403, "Forbidden"));
    if (!roles.includes(role)) return next(new HttpError(403, "Forbidden"));

    next();
  };
}

// ✅ Backward-compatible alias (your routes import allowRoles)
export const allowRoles = (...roles) => requireRole(...roles);
