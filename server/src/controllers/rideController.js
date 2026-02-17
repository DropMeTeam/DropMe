import DriverProfile from "../models/DriverProfile.js";
import Ride from "../models/Ride.js";

export async function createRide(req, res) {
  const user = req.user;

  const dp = await DriverProfile.findOne({ userId: user._id });
  if (!dp || dp.status !== "approved") {
    return res.status(403).json({ message: "Driver not approved yet." });
  }

  const { origin, destination, costPerKm, seatsTotal, departAt, routePoints, distanceMeters, durationSeconds } = req.body;

  const ride = await Ride.create({
    driverUserId: user._id,
    driverProfileId: dp._id,
    driverId: dp.driverId,

    origin: { label: origin.label, location: { type: "Point", coordinates: [origin.lng, origin.lat] } },
    destination: { label: destination.label, location: { type: "Point", coordinates: [destination.lng, destination.lat] } },

    routePoints: routePoints || [],
    distanceMeters: distanceMeters ?? null,
    durationSeconds: durationSeconds ?? null,

    costPerKm: Number(costPerKm),
    seatsTotal: Number(seatsTotal),
    seatsAvailable: Number(seatsTotal),

    departAt: new Date(departAt),
  });

  res.json({ ride });
}

export async function myRides(req, res) {
  const rides = await Ride.find({ driverUserId: req.user._id }).sort({ createdAt: -1 });
  res.json({ rides });
}

export async function searchRides(req, res) {
  const {
    oLat, oLng, dLat, dLng,
    radiusMeters = 4000,
  } = req.query;

  const originNear = {
    $near: {
      $geometry: { type: "Point", coordinates: [Number(oLng), Number(oLat)] },
      $maxDistance: Number(radiusMeters),
    },
  };

  const destNear = {
    $near: {
      $geometry: { type: "Point", coordinates: [Number(dLng), Number(dLat)] },
      $maxDistance: Number(radiusMeters),
    },
  };

  const rides = await Ride.find({
    status: "active",
    seatsAvailable: { $gt: 0 },
    "origin.location": originNear,
    "destination.location": destNear,
  })
    .populate("driverProfileId", "vehicle driverId status")
    .sort({ departAt: 1 })
    .limit(30);

  res.json({ rides });
}
