import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { RegisterSchema, LoginSchema } from "../validators/auth.validators.js";


const ADMIN_ROLES = new Set(["ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE"]);


function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function systemLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};

    const sysEmail = process.env.SYSTEM_ADMIN_EMAIL;
    const sysPass = process.env.SYSTEM_ADMIN_PASSWORD;

    if (!sysEmail || !sysPass) {
      return res.status(500).json({ message: "SYSTEM_ADMIN credentials not configured" });
    }

    if (email !== sysEmail || password !== sysPass) {
      return res.status(401).json({ message: "Invalid system admin credentials" });
    }

    const token = signToken(
      { sub: "system-admin", role: "SYSTEM_ADMIN", email: sysEmail, name: "System Admin" },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);

    res.json({
      user: { id: "system-admin", name: "System Admin", email: sysEmail, role: "SYSTEM_ADMIN" },
    });
  } catch (err) {
    next(err);
  }
}


export async function register(req, res, next) {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) throw new HttpError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(body.password, 12);

    const requestedRole = body.role ?? "rider";
    const isAdminRequest = ADMIN_ROLES.has(requestedRole);

    // block anyone trying to self-register SYSTEM_ADMIN (env-only)
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

    // ✅ admin requests: do NOT login; wait for approval
    if (isAdminRequest) {
      return res.status(201).json({
        ok: true,
        pending: true,
        message: "Admin request submitted. Wait for SYSTEM_ADMIN approval.",
        user: { id: user._id, name: user.name, email: user.email, role: user.role, adminStatus: user.adminStatus },
      });
    }

    // normal users: auto-login like before
    const token = signToken(
      { sub: user._id.toString(), role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await User.findOne({ email: body.email }).select("+passwordHash");
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    // ✅ block pending/denied admins
    if (ADMIN_ROLES.has(user.role) && user.adminStatus !== "approved") {
      throw new HttpError(403, `Admin ${user.adminStatus}. Wait for SYSTEM_ADMIN approval.`);
    }

    const token = signToken(
      { sub: user._id.toString(), role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, adminStatus: user.adminStatus } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function logout(_req, res) {
  res.clearCookie("token");
  res.json({ ok: true });
}
