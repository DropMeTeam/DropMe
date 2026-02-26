// controllers/offer.controller.js
import { RideOffer } from "../models/RideOffer.js";
import { CreateOfferSchema, UpdateOfferSchema } from "../validators/ride.validators.js";
import { User } from "../models/User.js";

function isOwnerOrAdmin(req, offer) {
  const isOwner = String(offer.driverId) === String(req.user.sub);
  const isAdmin = req.user?.role === "admin";
  return isOwner || isAdmin;
}

export async function createOffer(req, res, next) {
  try {
    const body = CreateOfferSchema.parse(req.body);

    const seatsTotal = body.seatsTotal ?? 3;

    // ✅ pull driver + vehicle from DB
    const driver = await User.findById(req.user.sub).lean();
    const regVehicle = driver?.driverRegistration?.vehicle || {};

    const offer = await RideOffer.create({
      driverId: req.user.sub,
      origin: {
        point: { type: "Point", coordinates: [body.origin.point.lng, body.origin.point.lat] },
        address: body.origin.address ?? "",
      },
      destination: {
        point: { type: "Point", coordinates: [body.destination.point.lng, body.destination.point.lat] },
        address: body.destination.address ?? "",
      },
      pickupTime: new Date(body.pickupTime),
      timeWindowMins: body.timeWindowMins ?? 15,
      seatsTotal,
      seatsAvailable: seatsTotal,
      routePolyline: body.routePolyline ?? "",
      priceLkr: body.priceLkr ?? 0,
      status: "open",

      // ✅ snapshots for rider UI
      driverSnapshot: {
        name: driver?.name || "",
        email: driver?.email || "",
        avatarUrl: driver?.avatarUrl || "",
      },
      vehicleSnapshot: {
        type: regVehicle?.type || "",
        number: regVehicle?.number || "",
        color: regVehicle?.color || "",
        seatsTotal: Number(regVehicle?.seatsTotal || seatsTotal),
        photoUrl: regVehicle?.photoUrl || "",
      },
    });

    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function myOffers(req, res, next) {
  try {
    const view = String(req.query.view || "all"); // all | upcoming | past
    const now = new Date();

    const q = { driverId: req.user.sub };

    if (view === "upcoming") {
      // upcoming/open rides
      q.pickupTime = { $gte: now };
      // optional: only open
      // q.status = "open";
    } else if (view === "past") {
      // past rides (time passed OR explicitly closed)
      q.$or = [
        { pickupTime: { $lt: now } },
        { status: "closed" },
      ];
    } // "all" => no extra filter

    // Sort strategy:
    // - upcoming: nearest first
    // - past: latest past first
    // - all: latest created first (or by pickupTime desc)
    let sort = { createdAt: -1 };
    if (view === "upcoming") sort = { pickupTime: 1 };
    if (view === "past") sort = { pickupTime: -1 };

    const offers = await RideOffer.find(q).sort(sort);
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}

// get one offer (for edit screen)
export async function getOfferById(req, res, next) {
  try {
    const offer = await RideOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (!isOwnerOrAdmin(req, offer)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

//  update offer (edit)
export async function updateOffer(req, res, next) {
  try {
    const body = UpdateOfferSchema.parse(req.body);

    const offer = await RideOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (!isOwnerOrAdmin(req, offer)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // update fields only if provided
    if (body.origin) {
      offer.origin = {
        point: { type: "Point", coordinates: [body.origin.point.lng, body.origin.point.lat] },
        address: body.origin.address ?? "",
      };
    }

    if (body.destination) {
      offer.destination = {
        point: { type: "Point", coordinates: [body.destination.point.lng, body.destination.point.lat] },
        address: body.destination.address ?? "",
      };
    }

    if (body.pickupTime) offer.pickupTime = new Date(body.pickupTime);
    if (typeof body.timeWindowMins === "number") offer.timeWindowMins = body.timeWindowMins;
    if (typeof body.routePolyline === "string") offer.routePolyline = body.routePolyline;
    if (typeof body.priceLkr === "number") offer.priceLkr = body.priceLkr;
    if (body.status) offer.status = body.status;

    if (typeof body.seatsTotal === "number") {
      offer.seatsTotal = body.seatsTotal;

      // keep seatsAvailable sane
      // (no booking system yet, so safest: clamp)
      offer.seatsAvailable = Math.min(offer.seatsAvailable, offer.seatsTotal);
      // If you want "reset seats" behavior instead:
      // offer.seatsAvailable = offer.seatsTotal;
    }

    if (body.status) {
  offer.status = body.status;

  if (body.status === "completed") {
    offer.completedAt = new Date();
  }
  // optional: if they move back from completed → open/closed
  if (body.status !== "completed") {
    offer.completedAt = null;
  }
}

    await offer.save();
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

// ✅ NEW: delete offer
export async function deleteOffer(req, res, next) {
  try {
    const offer = await RideOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (!isOwnerOrAdmin(req, offer)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await RideOffer.deleteOne({ _id: offer._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}