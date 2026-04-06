// server/src/middleware/auth.js
import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

function getTokenFromCookies(req) {
  return req.cookies?.client_token || req.cookies?.token || null;
}

export async function requireAuth(req, _res, next) {
  try {
    const token = getTokenFromCookies(req);
    if (!token) throw new HttpError(401, "Not authenticated");

    const decoded = verifyToken(token, process.env.JWT_SECRET);
    if (!decoded?.sub) throw new HttpError(401, "Invalid session");

    // ✅ DB is the authoritative role source (prevents stale-token 403)
    const dbUser = await User.findById(decoded.sub).select("role name email").lean();
    if (!dbUser) throw new HttpError(401, "Invalid session");

    req.user = {
      ...decoded,
      role: dbUser.role, // ✅ overwrite role from DB
      name: dbUser.name,
      email: dbUser.email,
    };

    next();
  } catch (_e) {
    next(new HttpError(401, "Invalid or expired session"));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    console.log("RBAC =>", { path: req.originalUrl, got: req.user?.role, need: roles });

    if (!req.user) return next(new HttpError(401, "Not authenticated"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
    next();
  };
}