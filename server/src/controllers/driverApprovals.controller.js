// driverApprovals.controller.js
import { User } from "../models/User.js";
import { DriverIdCounter } from "../models/DriverIdCounter.js";
import { HttpError } from "../utils/httpError.js";
import { sendDriverApprovedEmail } from "../utils/mailer.js";

async function generateDriverId() {
  const year = new Date().getFullYear();

  const counter = await DriverIdCounter.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `D/${year}/${counter.seq}`;
}

export async function listPendingDrivers(_req, res, next) {
  try {
    const drivers = await User.find({
      role: "driver",
      "driverRegistration.status": "pending",
    }).sort({ "driverRegistration.submittedAt": -1 });

    res.json({
      drivers: drivers.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        driverRegistration: u.driverRegistration,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function approveDriver(req, res, next) {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "Driver not found");
    if (user.role !== "driver") throw new HttpError(400, "Not a driver");

    // safer null checks
    if (!user.driverRegistration) {
      throw new HttpError(400, "Driver registration not found");
    }

    if (user.driverRegistration.status !== "pending") {
      throw new HttpError(400, "Driver is not pending");
    }

    const driverId = await generateDriverId();

    user.driverRegistration.status = "approved";
    user.driverRegistration.driverId = driverId;
    user.driverRegistration.reviewedAt = new Date();
    user.driverRegistration.reviewedBy = req.user.sub;
    user.driverRegistration.reviewNote = "";

    await user.save();

    // email should NOT break approval flow
    try {
      await sendDriverApprovedEmail({
        to: user.email,
        name: user.name,
        driverId,
      });
    } catch (mailErr) {
      console.error("sendDriverApprovedEmail failed:", mailErr);
    }

    return res.json({
      ok: true,
      driverId,
      message: "Driver approved successfully",
    });
  } catch (e) {
    next(e);
  }
}

export async function rejectDriver(req, res, next) {
  try {
    const { id } = req.params;
    const { note } = req.body || {};

    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "Driver not found");
    if (user.role !== "driver") throw new HttpError(400, "Not a driver");

    if (!user.driverRegistration) {
      throw new HttpError(400, "Driver registration not found");
    }

    if (user.driverRegistration.status !== "pending") {
      throw new HttpError(400, "Driver is not pending");
    }

    user.driverRegistration.status = "rejected";
    user.driverRegistration.reviewedAt = new Date();
    user.driverRegistration.reviewedBy = req.user.sub;
    user.driverRegistration.reviewNote = String(note || "").slice(0, 300);

    await user.save();

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}