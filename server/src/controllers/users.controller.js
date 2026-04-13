import { User } from "../models/User.js";
import { RideBooking } from "../models/RideBooking.js";
import { RideRequest } from "../models/RideRequest.js";
import { HttpError } from "../utils/httpError.js";
import { publicBaseUrl } from "../utils/publicBaseUrl.js";

function fileUrl(req, filename) {
  return `${publicBaseUrl(req)}/uploads/${filename}`;
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
        contactNo: user.contactNo || "",
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

    const { name, contactNo } = req.body;

    if (name !== undefined) user.name = String(name).trim();
    if (contactNo !== undefined) user.contactNo = String(contactNo).trim();

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
        contactNo: user.contactNo || "",
        driverRegistration: user.driverRegistration || null,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteMe(req, res, next) {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) throw new HttpError(404, "User not found");

    if (user.role === "rider") {
      await RideRequest.deleteMany({ riderId: user._id });
      await RideBooking.deleteMany({ riderId: user._id });
    }

    await User.deleteOne({ _id: user._id });

    res.json({
      ok: true,
      message: "Account deleted successfully.",
    });
  } catch (e) {
    next(e);
  }
}