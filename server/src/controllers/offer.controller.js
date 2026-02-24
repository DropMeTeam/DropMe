// src/controllers/offer.controller.js
import { RideOffer } from "../models/RideOffer.js";

/**
 * Assumptions about auth middleware:
 * - requireAuth sets req.user = { _id, role, ... }
 * - driver creates/owns offers via driverId
 *
 * If your req.user shape is different, update the few lines where driverId is taken.
 */

function isAdmin(user) {
  return user?.role === "admin";
}

function getUserId(user) {
  // Support common shapes
  return user?._id || user?.id || user?.userId;
}

function toObjectIdString(v) {
  if (!v) return "";
  return String(v);
}

/**
 * POST /api/offers
 * driver/admin
 */
export async function createOffer(req, res, next) {
  try {
    const userId = getUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      origin,
      destination,
      pickupTime,
      seatsTotal,
      priceLkr,
      vehicleSnapshot, // optional snapshot object
    } = req.body || {};

    // Basic validation (keep it lightweight)
    if (!origin || !destination || !pickupTime) {
      return res.status(400).json({ message: "origin, destination, pickupTime are required" });
    }

    const total = Number(seatsTotal);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ message: "seatsTotal must be a positive number" });
    }

    const created = await RideOffer.create({
      driverId: userId,
      origin,
      destination,
      pickupTime,
      seatsTotal: total,
      seatsAvailable: total, // start full
      priceLkr: priceLkr ?? 0,
      status: "active",
      vehicleSnapshot: vehicleSnapshot || {}, // safe default
    });

    res.status(201).json({ ok: true, offer: created });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/offers/my
 * driver/admin
 */
export async function myOffers(req, res, next) {
  try {
    const userId = getUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // For drivers: only own offers. For admin: optionally allow ?driverId=
    const filter = isAdmin(req.user) && req.query.driverId
      ? { driverId: req.query.driverId }
      : { driverId: userId };

    const offers = await RideOffer.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ ok: true, offers });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/offers/:id
 * driver/admin
 */
export async function getOfferById(req, res, next) {
  try {
    const userId = getUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const offer = await RideOffer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    // Drivers can only read their own offers
    if (!isAdmin(req.user) && toObjectIdString(offer.driverId) !== toObjectIdString(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ ok: true, offer });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/offers/:id
 * driver/admin
 */
export async function updateOffer(req, res, next) {
  try {
    const userId = getUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const offer = await RideOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (!isAdmin(req.user) && toObjectIdString(offer.driverId) !== toObjectIdString(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Allow updating a controlled subset (avoid accidental overwrites)
    const allowed = [
      "origin",
      "destination",
      "pickupTime",
      "status",
      "priceLkr",
      "seatsTotal",
      "seatsAvailable",
      "vehicleSnapshot",
    ];

    for (const key of allowed) {
      if (key in (req.body || {})) offer[key] = req.body[key];
    }

    // Optional sanity: seatsAvailable <= seatsTotal
    if (
      offer.seatsTotal != null &&
      offer.seatsAvailable != null &&
      Number(offer.seatsAvailable) > Number(offer.seatsTotal)
    ) {
      offer.seatsAvailable = offer.seatsTotal;
    }

    const saved = await offer.save();
    res.json({ ok: true, offer: saved });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/offers/:id
 * driver/admin
 */
export async function deleteOffer(req, res, next) {
  try {
    const userId = getUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const offer = await RideOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (!isAdmin(req.user) && toObjectIdString(offer.driverId) !== toObjectIdString(userId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await offer.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/offers/public/:id
 * public
 */
export async function getOfferPublic(req, res, next) {
  try {
    const offer = await RideOffer.findById(req.params.id)
      .populate("driverId", "name avatarUrl email")
      .lean();

    if (!offer) return res.status(404).json({ message: "Offer not found" });

    const driver = offer?.driverId || {};
    const driverSnapshot = {
      name: driver?.name || "Driver",
      avatarUrl: driver?.avatarUrl || "",
      email: driver?.email || "",
    };

    const v = offer?.vehicleSnapshot || {};
    const vehicleSnapshot = {
      type: v?.type || "",
      number: v?.number || "",
      color: v?.color || "",
      seatsTotal: v?.seatsTotal ?? null,
      photoUrl: v?.photoUrl || "",
    };

    res.json({
      offer: {
        _id: offer._id,
        status: offer.status,
        pickupTime: offer.pickupTime,
        seatsTotal: offer.seatsTotal,
        seatsAvailable: offer.seatsAvailable,
        priceLkr: offer.priceLkr,
        origin: offer.origin,
        destination: offer.destination,
        driverSnapshot,
        vehicleSnapshot,
      },
    });
  } catch (err) {
    next(err);
  }
}