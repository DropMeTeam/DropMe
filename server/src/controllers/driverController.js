import DriverProfile from "../models/DriverProfile.js";
import Ride from "../models/Ride.js";

export async function getDriverDashboard(req, res) {
  const user = req.user;
  const profile = await DriverProfile.findOne({ userId: user._id });
  const rides = await Ride.find({ driverUserId: user._id }).sort({ createdAt: -1 }).limit(20);
  res.json({ user, driverProfile: profile, rides });
}

export async function registerDriver(req, res) {
  const user = req.user;

  const {
    nic, address, age, licenseNumber,
    vehicleType, vehicleNumber, vehicleColor, vehicleSeatsTotal,
  } = req.body;

  const licenseImage = req.files?.licenseImage?.[0];
  const vehiclePhoto = req.files?.vehiclePhoto?.[0];

  if (!licenseImage || !vehiclePhoto) {
    return res.status(400).json({ message: "License image and vehicle photo are required." });
  }

  const doc = {
    userId: user._id,
    status: "pending",
    nic,
    address,
    age: Number(age),
    licenseNumber,
    licenseImageUrl: `/uploads/${licenseImage.filename}`,
    vehicle: {
      type: vehicleType,
      number: vehicleNumber,
      color: vehicleColor,
      seatsTotal: Number(vehicleSeatsTotal),
      photoUrl: `/uploads/${vehiclePhoto.filename}`,
    },
  };

  const saved = await DriverProfile.findOneAndUpdate(
    { userId: user._id },
    { $set: doc, $setOnInsert: { driverId: null } },
    { new: true, upsert: true }
  );

  res.json({ driverProfile: saved });
}
