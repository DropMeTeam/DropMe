import { User } from "../models/User.js";
import { HttpError } from "../utils/httpError.js";


const ADMIN_ROLES = ["ADMIN_TRAIN", "ADMIN_BUS", "ADMIN_PRIVATE"];

export async function listPendingAdmins(req, res, next) {
  try {
    const pending = await User.find({
      role: { $in: ADMIN_ROLES },
      adminStatus: "pending",
    }).sort({ createdAt: -1 });

    res.json({ pending });
  } catch (e) {
    next(e);
  }
}

export async function approveAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const u = await User.findById(id);
    if (!u) throw new HttpError(404, "User not found");

    u.adminStatus = "approved";
    await u.save();

    res.json({ ok: true, user: { id: u._id, email: u.email, role: u.role, adminStatus: u.adminStatus } });
  } catch (e) {
    next(e);
  }
}

export async function denyAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const u = await User.findById(id);
    if (!u) throw new HttpError(404, "User not found");

    u.adminStatus = "denied";
    await u.save();

    res.json({ ok: true, user: { id: u._id, email: u.email, role: u.role, adminStatus: u.adminStatus } });
  } catch (e) {
    next(e);
  }
}
