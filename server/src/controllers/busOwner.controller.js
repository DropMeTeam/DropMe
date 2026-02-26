import { Bus } from "../models/Bus.js";
import { HttpError } from "../utils/httpError.js";

export async function createBus(req, res, next) {
  try {
    const ownerId = req.user.sub;

    const {
      busName = "",
      plateNumber,
      busType = "Normal",
      seatsTotal,
      color = "",
      photoUrl = "",
    } = req.body;

    if (!plateNumber || !String(plateNumber).trim()) throw new HttpError(400, "plateNumber is required");
    const seats = Number(seatsTotal);
    if (!Number.isFinite(seats) || seats < 1) throw new HttpError(400, "seatsTotal must be a valid number >= 1");

    const created = await Bus.create({
      owner: ownerId,
      busName,
      plateNumber: String(plateNumber).trim().toUpperCase(),
      busType,
      seatsTotal: seats,
      color,
      photoUrl,
      status: "pending",
    });

    // Optional: real-time notify admin bus workspace
    req.io?.emit("bus:pendingCreated", { id: created._id });

    res.status(201).json({ ok: true, bus: created });
  } catch (e) {
    if (e?.code === 11000) return next(new HttpError(409, "Bus with this plate number already exists for this owner"));
    next(e);
  }
}

export async function listMyBuses(req, res, next) {
  try {
    const ownerId = req.user.sub;
    const buses = await Bus.find({ owner: ownerId }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, buses });
  } catch (e) {
    next(e);
  }
}