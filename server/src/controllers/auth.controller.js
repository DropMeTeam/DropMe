// Import password hashing library
import bcrypt from "bcryptjs";

// Import User model
import { User } from "../models/User.js";

// Import custom HTTP error class
import { HttpError } from "../utils/httpError.js";

// Import JWT token generator
import { signToken } from "../utils/jwt.js";

// Import validation schemas for register/login
import { RegisterSchema, LoginSchema } from "../validators/auth.validators.js";

/**
 * Roles considered as admin-type roles
 */
const ADMIN_ROLES = new Set(["ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE"]);

/**
 * Set authentication cookie in browser
 *
 * Cookie name: client_token
 * Notes:
 * - httpOnly: frontend JS cannot read it
 * - sameSite: basic CSRF protection
 * - secure: should be true in production with HTTPS
 * - path: only sent for /api routes
 */
function setAuthCookie(res, token) {
  // single-portal cookie
  res.cookie("client_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api",
  });
}

/**
 * Clear authentication cookies
 *
 * This removes:
 * - current cookie: client_token
 * - old legacy token cookies for backward compatibility
 */
function clearAuthCookies(res) {
  res.clearCookie("client_token", { path: "/api" });

  // backward compatibility cleanup
  res.clearCookie("token");
  res.clearCookie("token", { path: "/api" });
}

/**
 * REGISTER USER
 *
 * Flow:
 * 1. Validate request body
 * 2. Check if email already exists
 * 3. Hash password
 * 4. Create user in DB
 * 5. Auto-login immediately
 * 6. Return user data
 */
export async function register(req, res, next) {
  try {
    // Validate incoming data
    const body = RegisterSchema.parse(req.body);

    // Check for duplicate email
    const existing = await User.findOne({ email: body.email });
    if (existing) throw new HttpError(409, "Email already in use");

    // Hash password before saving
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Get requested role, default is rider
    const requestedRole = body.role ?? "rider";

    // Check whether selected role is an admin role
    const isAdmin = ADMIN_ROLES.has(requestedRole);

    // Create new user
    const user = await User.create({
      name: body.name,
      email: body.email,
      passwordHash,
      role: requestedRole,
      // no adminStatus anymore
    });

    /**
     * Auto-login all users immediately after registration
     * (including admin roles)
     */
    const token = signToken(
      {
        sub: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    // Save JWT in cookie
    setAuthCookie(res, token);

    // Return created user data
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

/**
 * LOGIN USER
 *
 * Flow:
 * 1. Validate request body
 * 2. Find user by email
 * 3. Compare password
 * 4. Create token
 * 5. Set cookie
 * 6. Return user info
 */
export async function login(req, res, next) {
  try {
    // Validate incoming login data
    const body = LoginSchema.parse(req.body);

    // Find user and explicitly include passwordHash
    const user = await User.findOne({ email: body.email }).select("+passwordHash");
    if (!user) throw new HttpError(401, "Invalid credentials");

    // Compare plain password with hashed password
    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    // Create JWT token
    const token = signToken(
      {
        sub: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET
    );

    // Save token in cookie
    setAuthCookie(res, token);

    // Return logged-in user data
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

/**
 * GET CURRENT LOGGED-IN USER
 *
 * Flow:
 * 1. Read user id from req.user (set by auth middleware)
 * 2. Fetch latest user data from DB
 * 3. Return normalized user object
 */
export async function me(req, res, next) {
  try {
    // Load fresh user data from database
    const dbUser = await User.findById(req.user.sub).lean();
    if (!dbUser) throw new HttpError(404, "User not found");

    // Return user profile
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

/**
 * LOGOUT USER
 *
 * Clears all related auth cookies
 */
export async function logout(_req, res) {
  clearAuthCookies(res);
  return res.json({ ok: true });
}