import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { RegisterSchema, LoginSchema } from "../validators/auth.validators.js";

const ADMIN_ROLES = new Set(["ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE"]);

function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api",
  };
}

function setAuthCookie(res, token) {
  res.cookie("client_token", token, getCookieOptions());
}

function clearAuthCookies(res) {
  const options = getCookieOptions();

  res.clearCookie("client_token", options);

  res.clearCookie("token");
  res.clearCookie("token", { path: "/api" });
  res.clearCookie("token", {
    path: "/api",
    sameSite: options.sameSite,
    secure: options.secure,
  });
}

export async function register(req, res, next) {
  try {
    const body = RegisterSchema.parse(req.body);

    const existing = await User.findOne({ email: body.email });
    if (existing) throw new HttpError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const requestedRole = body.role ?? "rider";
    const isAdmin = ADMIN_ROLES.has(requestedRole);

    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: requestedRole,
    });

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
        name: user.name,
        email: user.email,
        role: user.role,
        contactNo: user.contactNo || "",
      },
      isAdmin,
    });
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
        name: user.name,
        email: user.email,
        role: user.role,
        contactNo: user.contactNo || "",
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const dbUser = await User.findById(req.user.sub).lean();
    if (!dbUser) throw new HttpError(404, "User not found");

    res.json({
      user: {
        sub: String(dbUser._id),
        id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        avatarUrl: dbUser.avatarUrl || "",
        contactNo: dbUser.contactNo || "",
        driverRegistration: dbUser.driverRegistration || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req, res) {
  clearAuthCookies(res);
  return res.json({ ok: true });
}