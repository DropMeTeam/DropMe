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

    const driver = await User.findById(req.user.sub).lean();
    const regVehicle = driver?.driverRegistration?.vehicle;

    if (!regVehicle?.seatsTotal) {
      return res.status(400).json({
        message: "Driver vehicle seats not found. Submit driver registration first.",
      });
    }

    const vehicleSeats = Number(regVehicle.seatsTotal);
    if (!Number.isFinite(vehicleSeats) || vehicleSeats < 1 || vehicleSeats > 6) {
      return res.status(400).json({
        message: "Invalid vehicle seatsTotal in driver registration.",
      });
    }

    const seatsTotal = vehicleSeats;

    const offer = await RideOffer.create({
      driverId: req.user.sub,
      origin: {
        point: {
          type: "Point",
          coordinates: [body.origin.point.lng, body.origin.point.lat],
        },
        address: body.origin.address ?? "",
      },
      destination: {
        point: {
          type: "Point",
          coordinates: [body.destination.point.lng, body.destination.point.lat],
        },
        address: body.destination.address ?? "",
      },
      pickupTime: new Date(body.pickupTime),
      timeWindowMins: body.timeWindowMins ?? 15,

      seatsTotal,
      seatsAvailable: seatsTotal,

      routePolyline: body.routePolyline ?? "",

      // NEW
      distanceKm: Number(body.distanceKm || 0),

      priceLkr: body.priceLkr ?? 0,
      status: "open",

      driverSnapshot: {
        name: driver?.name || "",
        email: driver?.email || "",
        avatarUrl: driver?.avatarUrl || "",
      },

      vehicleSnapshot: {
        type: regVehicle?.type || "",
        number: regVehicle?.number || "",
        color: regVehicle?.color || "",
        seatsTotal,
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
    const view = String(req.query.view || "all");
    const now = new Date();

    const q = { driverId: req.user.sub };

    if (view === "upcoming") {
      q.pickupTime = { $gte: now };
    } else if (view === "past") {
      q.$or = [{ pickupTime: { $lt: now } }, { status: "closed" }];
    }

    let sort = { createdAt: -1 };
    if (view === "upcoming") sort = { pickupTime: 1 };
    if (view === "past") sort = { pickupTime: -1 };

    const offers = await RideOffer.find(q).sort(sort);
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}

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

export async function updateOffer(req, res, next) {
  try {
    const body = UpdateOfferSchema.parse(req.body);

    const offer = await RideOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: "Offer not found" });

    if (!isOwnerOrAdmin(req, offer)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (body.origin) {
      offer.origin = {
        point: {
          type: "Point",
          coordinates: [body.origin.point.lng, body.origin.point.lat],
        },
        address: body.origin.address ?? "",
      };
    }

    if (body.destination) {
      offer.destination = {
        point: {
          type: "Point",
          coordinates: [body.destination.point.lng, body.destination.point.lat],
        },
        address: body.destination.address ?? "",
      };
    }

    if (body.pickupTime) offer.pickupTime = new Date(body.pickupTime);
    if (typeof body.timeWindowMins === "number") offer.timeWindowMins = body.timeWindowMins;
    if (typeof body.routePolyline === "string") offer.routePolyline = body.routePolyline;
    if (typeof body.priceLkr === "number") offer.priceLkr = body.priceLkr;

    // NEW
    if (typeof body.distanceKm === "number") offer.distanceKm = body.distanceKm;

    if (typeof body.seatsTotal === "number") {
      offer.seatsTotal = body.seatsTotal;
      offer.seatsAvailable = Math.min(offer.seatsAvailable, offer.seatsTotal);
    }

    if (body.status) {
      offer.status = body.status;

      if (body.status === "completed") {
        offer.completedAt = new Date();
      } else {
        offer.completedAt = null;
      }
    }

    await offer.save();
    res.json({ offer });
  } catch (err) {
    next(err);
  }
}

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