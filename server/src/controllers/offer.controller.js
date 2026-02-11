import { RideOffer } from "../models/RideOffer.js";
import { CreateOfferSchema } from "../validators/ride.validators.js";

export async function createOffer(req, res, next) {
  try {
    const body = CreateOfferSchema.parse(req.body);

    const offer = await RideOffer.create({
      driverId: req.user.sub,
      origin: {
        point: { type: "Point", coordinates: [body.origin.point.lng, body.origin.point.lat] },
        address: body.origin.address ?? ""
      },
      destination: {
        point: { type: "Point", coordinates: [body.destination.point.lng, body.destination.point.lat] },
        address: body.destination.address ?? ""
      },
      pickupTime: new Date(body.pickupTime),
      timeWindowMins: body.timeWindowMins ?? 15,
      seatsTotal: body.seatsTotal ?? 3,
      seatsAvailable: body.seatsTotal ?? 3,
      routePolyline: body.routePolyline ?? ""
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
