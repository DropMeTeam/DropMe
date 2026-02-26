// server/src/middleware/auth.js
import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

function getToken(req) {
  // 1) Cookie token (preferred)
  const cookieToken = req.cookies?.client_token || req.cookies?.token;
  if (cookieToken) return cookieToken;

  // 2) Bearer token fallback
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);

  return null;
}

export function requireAuth(req, _res, next) {
  try {
    const token = getToken(req);
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
    if (!roles.includes(req.user.role)) {
      //  clearer error message (helps debugging)
      return next(new HttpError(403, `Forbidden. Need: ${roles.join(", ")}. Got: ${req.user.role}`));
    }

    if (!roles.includes(req.user.role)) {
      // ✅ clearer error message (helps debugging)
      return next(new HttpError(403, `Forbidden. Need: ${roles.join(", ")}. Got: ${req.user.role}`));
    }

    next();
  };
}