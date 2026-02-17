import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";

// helper to build a public URL for uploaded file
function fileUrl(req, filename) {
  const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${filename}`;
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.sub).lean();
    if (!user) throw new HttpError(404, "User not found");
    res.json({
      user: {
        id: user._id,
        sub: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
        driverRegistration: user.driverRegistration || null,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function updateMe(req, res, next) {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) throw new HttpError(404, "User not found");

    const { name } = req.body;
    if (name !== undefined) user.name = String(name).trim();

    // multer single file name: "avatar"
    const avatar = req.file;
    if (avatar) {
      user.avatarUrl = fileUrl(req, avatar.filename);
    }

    await user.save();

    res.json({
      ok: true,
      user: {
        id: user._id,
        sub: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || "",
        driverRegistration: user.driverRegistration || null,
      },
    });
  } catch (e) {
    next(e);
  }
}
