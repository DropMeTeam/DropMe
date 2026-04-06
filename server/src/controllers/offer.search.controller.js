// controllers/offer.search.controller.js
import { RideOffer } from "../models/RideOffer.js";

export async function searchOffers(req, res, next) {
  try {
    const originLat = Number(req.query.originLat);
    const originLng = Number(req.query.originLng);
    const destLat = Number(req.query.destLat);
    const destLng = Number(req.query.destLng);

    const pickupTime = new Date(req.query.pickupTime);
    const seatsNeeded = Math.max(1, Number(req.query.seatsNeeded || 1));

    const radiusMeters = Number(req.query.radiusMeters || 3000); // 3km
    const timeWindowMins = Number(req.query.timeWindowMins || 30); // +-30 mins

    if (![originLat, originLng, destLat, destLng].every(Number.isFinite) || isNaN(pickupTime.getTime())) {
      return res.status(400).json({ message: "Invalid search parameters." });
    }

    const start = new Date(pickupTime.getTime() - timeWindowMins * 60 * 1000);
    const end = new Date(pickupTime.getTime() + timeWindowMins * 60 * 1000);

    const earthRadiusMeters = 6378137;
    const sphereRadius = radiusMeters / earthRadiusMeters;

    // ✅ geoNear on origin + geoWithin filter for destination
    const offers = await RideOffer.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [originLng, originLat] },
          key: "origin.point",
          spherical: true,
          maxDistance: radiusMeters,
          distanceField: "originDistanceMeters",
        },
      },
      {
        $match: {
          status: "open",
          pickupTime: { $gte: start, $lte: end },
          seatsAvailable: { $gte: seatsNeeded },
          "destination.point": {
            $geoWithin: { $centerSphere: [[destLng, destLat], sphereRadius] },
          },
        },
      },
      { $sort: { originDistanceMeters: 1, pickupTime: 1 } },
      { $limit: 50 },
    ]);

    res.json({ offers });
  } catch (err) {
    next(err);
  }
}