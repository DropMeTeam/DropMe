import { User } from "../models/User.js";
import { RideOffer } from "../models/RideOffer.js";
import { CreateOfferSchema, UpdateOfferSchema } from "../validators/ride.validators.js";

function isOwnerOrAdmin(req, offer) {
  const userId = String(req.user?.sub || "");
  const offerOwnerId = String(offer?.driverId || "");
  const role = String(req.user?.role || "");

  return (
    userId === offerOwnerId ||
    role === "admin" ||
    role === "ADMIN" ||
    role.startsWith("ADMIN_")
  );
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
      q.$or = [{ pickupTime: { $lt: now } }, { status: "closed" }, { status: "completed" }];
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

export async function searchOffers(req, res, next) {
  try {
    const now = new Date();
    const q = {
      status: "open",
      pickupTime: { $gte: now },
    };

    const offers = await RideOffer.find(q)
      .sort({ pickupTime: 1, createdAt: -1 })
      .limit(100);

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
    if (typeof body.distanceKm === "number") offer.distanceKm = body.distanceKm;

    if (typeof body.seatsTotal === "number") {
      offer.seatsTotal = body.seatsTotal;
      offer.seatsAvailable = Math.min(offer.seatsAvailable, offer.seatsTotal);
    }

    if (body.status) {
      offer.status = body.status;
      offer.completedAt = body.status === "completed" ? new Date() : null;
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