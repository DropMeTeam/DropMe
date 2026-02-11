import { RideRequest } from "../models/RideRequest.js";
import { CreateRequestSchema } from "../validators/ride.validators.js";

export async function createRequest(req, res, next) {
  try {
    const body = CreateRequestSchema.parse(req.body);

    const request = await RideRequest.create({
      riderId: req.user.sub,
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
      seatsNeeded: body.seatsNeeded ?? 1,
      mode: body.mode ?? "POOL"
    });

    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
}

export async function myRequests(req, res, next) {
  try {
    const requests = await RideRequest.find({ riderId: req.user.sub }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
}
