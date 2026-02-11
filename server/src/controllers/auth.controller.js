import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";
import { signToken } from "../utils/jwt.js";
import { RegisterSchema, LoginSchema } from "../validators/auth.validators.js";

function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true behind HTTPS in production
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

export async function register(req, res, next) {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing) throw new HttpError(409, "Email already in use");

    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role ?? "rider"
    });

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

    const token = signToken(
      { sub: user._id.toString(), role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET
    );

    setAuthCookie(res, token);
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
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
