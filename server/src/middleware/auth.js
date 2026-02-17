import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) throw new HttpError(401, "Not authenticated");
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
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
