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
<<<<<<< Updated upstream
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "Forbidden"));
=======
    if (!roles.includes(req.user.role)) {
      //  clearer error message (helps debugging)
      return next(new HttpError(403, `Forbidden. Need: ${roles.join(", ")}. Got: ${req.user.role}`));
    }
>>>>>>> Stashed changes
    next();
  };
}
