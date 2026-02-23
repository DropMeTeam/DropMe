// controllers/offer.controller.js
import { RideOffer } from "../models/RideOffer.js";
import { CreateOfferSchema } from "../validators/ride.validators.js";

// OPTIONAL if you have it:
// import { DriverRegistration } from "../models/DriverRegistration.js";
// import { User } from "../models/User.js";

export async function createOffer(req, res, next) {
  try {
    const body = CreateOfferSchema.parse(req.body);

    // ✅ snapshots (fallback to whatever auth middleware gives you)
    const driverSnapshot = {
      name: req.user?.name || "",
      email: req.user?.email || "",
      avatarUrl: req.user?.avatarUrl || "",
    };

    let vehicleSnapshot = {
      type: "",
      number: "",
      color: "",
      seatsTotal: null,
      photoUrl: "",
    };

    // ✅ If you have driver registration model, uncomment and adjust:
    // const reg = await DriverRegistration.findOne({ userId: req.user.sub });
    // if (!reg || reg.status !== "approved") return res.status(403).json({ message: "Driver not approved." });
    // vehicleSnapshot = {
    //   type: reg.vehicle?.type || "",
    //   number: reg.vehicle?.number || "",
    //   color: reg.vehicle?.color || "",
    //   seatsTotal: reg.vehicle?.seatsTotal ?? null,
    //   photoUrl: reg.vehicle?.photoUrl || "",
    // };

    const seatsTotal = body.seatsTotal ?? 3;

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

      driverSnapshot,
      vehicleSnapshot,
    });

    res.status(201).json({ offer });
  } catch (err) {
    next(err);
  }
}

export async function myOffers(req, res, next) {
  try {
    const offers = await RideOffer.find({ driverId: req.user.sub }).sort({ createdAt: -1 });
    res.json({ offers });
  } catch (err) {
    next(err);
  }
}