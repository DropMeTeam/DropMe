import { Bus } from "../models/Bus.js";
import { HttpError } from "../utils/httpError.js";

export async function listPendingBusRegistrations(req, res, next) {
  try {
    const pending = await Bus.find({ status: "pending" })
      .populate("owner", "name email role")
      .populate("routeId", "routeNumber start end routeType")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, pending });
  } catch (e) {
    next(e);
  }
}

export async function approveBus(req, res, next) {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);
    if (!bus) throw new HttpError(404, "Bus not found");

    bus.status = "approved";
    bus.reviewedAt = new Date();
    bus.reviewedBy = req.user.sub;
    bus.reviewNote = req.body?.note || "";
    await bus.save();

    req.io?.emit("bus:approved", { id: bus._id, owner: String(bus.owner) });

    res.json({ ok: true, bus });
  } catch (e) {
    next(e);
  }
}

export async function rejectBus(req, res, next) {
  try {
    const { id } = req.params;

    const bus = await Bus.findById(id);
    if (!bus) throw new HttpError(404, "Bus not found");

    bus.status = "rejected";
    bus.reviewedAt = new Date();
    bus.reviewedBy = req.user.sub;
    bus.reviewNote = req.body?.note || "Rejected";
    await bus.save();

    req.io?.emit("bus:rejected", { id: bus._id, owner: String(bus.owner) });

    res.json({ ok: true, bus });
  } catch (e) {
    next(e);
  }
}