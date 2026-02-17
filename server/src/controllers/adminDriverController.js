import DriverProfile from "../models/DriverProfile.js";
import Counter from "../models/Counter.js";
import { sendDriverApprovedEmail } from "../utils/mailer.js";

function makeDriverId(year, seq) {
  return `D/${year}/${seq}`;
}

export async function listPendingDrivers(req, res) {
  const list = await DriverProfile.find({ status: "pending" })
    .populate("userId", "fullName email avatarUrl");
  res.json({ items: list });
}

export async function approveDriver(req, res) {
  const id = req.params.id;
  const profile = await DriverProfile.findById(id).populate("userId", "email");
  if (!profile) return res.status(404).json({ message: "Driver profile not found." });

  const year = new Date().getFullYear();
  const key = `driver:${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const driverId = makeDriverId(year, counter.seq);

  profile.status = "approved";
  profile.driverId = driverId;
  await profile.save();

  // Send email
  try {
    await sendDriverApprovedEmail({ to: profile.userId.email, driverId });
  } catch {
    // safe-mode: approval should still succeed even if email fails
  }

  res.json({ driverProfile: profile });
}

export async function rejectDriver(req, res) {
  const id = req.params.id;
  const profile = await DriverProfile.findById(id);
  if (!profile) return res.status(404).json({ message: "Driver profile not found." });

  profile.status = "rejected";
  await profile.save();

  res.json({ driverProfile: profile });
}
