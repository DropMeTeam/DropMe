import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { RegisterSchema, LoginSchema } from "../validators/auth.validators.js";

/**
 * Roles that require SYSTEM_ADMIN approval before login is allowed
 */
const ADMIN_ROLES = new Set(["ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE"]);

/**
 * Set authentication cookies.
 *
 * Writes both:
 * - client_token (newer app flow)
 * - token (backward compatibility)
 */
function setAuthCookie(res, token) {
  const baseOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res.cookie("client_token", token, {
    ...baseOptions,
    path: "/api",
  });

  res.cookie("token", token, baseOptions);
}

/**
 * Clear authentication cookies
 */
function clearAuthCookies(res) {
  res.clearCookie("client_token", { path: "/api" });
  res.clearCookie("token");
  res.clearCookie("token", { path: "/api" });
}

/**
 * SYSTEM ADMIN LOGIN
 *
 * Uses environment variables:
 * - SYSTEM_ADMIN_EMAIL
 * - SYSTEM_ADMIN_PASSWORD
 */
export async function systemLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};

    const sysEmail = process.env.SYSTEM_ADMIN_EMAIL;
    const sysPass = process.env.SYSTEM_ADMIN_PASSWORD;

    if (!sysEmail || !sysPass) {
      return res.status(500).json({
        message: "SYSTEM_ADMIN credentials not configured",
      });
    }

    if (email !== sysEmail || password !== sysPass) {
      return res.status(401).json({
        message: "Invalid system admin credentials",
      });
    }

    const token = signToken(
      {
        sub: "system-admin",
        role: "SYSTEM_ADMIN",
        email: sysEmail,
        name: "System Admin",
      },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);

    res.json({
      user: {
        id: "system-admin",
        sub: "system-admin",
        name: "System Admin",
        email: sysEmail,
        role: "SYSTEM_ADMIN",
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * USER REGISTRATION
 *
 * Admin roles:
 * - created as pending
 * - cannot log in until approved
 *
 * Normal users:
 * - auto login immediately
 */
export async function register(req, res, next) {
  try {
    const body = RegisterSchema.parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) throw new HttpError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(body.password, 12);

    const requestedRole = body.role ?? "rider";
    const isAdminRequest = ADMIN_ROLES.has(requestedRole);

    if (requestedRole === "SYSTEM_ADMIN") {
      throw new HttpError(403, "SYSTEM_ADMIN cannot be self-registered");
    }

    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: requestedRole,
      adminStatus: isAdminRequest ? "pending" : "approved",
    });

    if (isAdminRequest) {
      return res.status(201).json({
        ok: true,
        pending: true,
        message: "Admin request submitted. Wait for SYSTEM_ADMIN approval.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          adminStatus: user.adminStatus,
        },
      });
    }

    const token = signToken(
      {
        sub: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);

    res.status(201).json({
      user: {
        id: user._id,
        sub: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        adminStatus: user.adminStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * USER LOGIN
 */
export async function login(req, res, next) {
  try {
    const body = LoginSchema.parse(req.body);

    const user = await User.findOne({ email: body.email }).select("+passwordHash");
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    if (ADMIN_ROLES.has(user.role) && user.adminStatus !== "approved") {
      throw new HttpError(
        403,
        `Admin ${user.adminStatus}. Wait for SYSTEM_ADMIN approval.`
      );
    }

    const token = signToken(
      {
        sub: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);

    res.json({
      user: {
        id: user._id,
        sub: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        adminStatus: user.adminStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET CURRENT LOGGED-IN USER
 */
export async function me(req, res, next) {
  try {
    if (req.user?.sub === "system-admin") {
      return res.json({ user: req.user });
    }

    const dbUser = await User.findById(req.user?.sub).lean();
    if (!dbUser) throw new HttpError(404, "User not found");

    res.json({
      user: {
        sub: String(dbUser._id),
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        adminStatus: dbUser.adminStatus,
        avatarUrl: dbUser.avatarUrl || "",
        driverRegistration: dbUser.driverRegistration || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * LOGOUT USER
 */
export async function logout(_req, res) {
  clearAuthCookies(res);
  return res.json({ ok: true });
}