import express from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { HttpError } from "../utils/httpError.js";
import DriverProfile from "../models/DriverProfile.js";
// If you have Ride model, import it. Otherwise keep empty list.
// import Ride from "../models/Ride.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function normalizeVehicleType(v) {
  const raw = String(v || "").trim().toLowerCase();
  if (raw === "car") return "car";
  if (raw === "mini car" || raw === "mini_car" || raw === "minicar") return "mini_car";
  if (raw === "van") return "van";
  if (raw === "mini van" || raw === "mini_van" || raw === "minivan") return "mini_van";
  if (raw === "suv") return "suv";
  return null;
}

// ✅ GET /api/driver/dashboard
router.get("/dashboard", requireAuth, requireRole("driver"), async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) throw new HttpError(401, "Not authenticated");

    const profile = await DriverProfile.findOne({ customerId: userId }).lean();

    // If you have rides:
    // const rides = await Ride.find({ driverCustomerId: userId }).sort({ createdAt: -1 }).lean();
    const rides = [];

    res.json({
      ok: true,
      user: req.user,
      registration: profile
        ? {
            status: profile.status,
            driverId: profile.driverId || null,
            vehicleType: profile.vehicleType,
            totalSeats: profile.totalSeats,
          }
        : { status: "NOT_SUBMITTED", driverId: null },
      rides,
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/registration",
  requireAuth,
  requireRole("driver"),
  upload.fields([
    { name: "licenseImage", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const userId = req.user?.id || req.user?._id;
      if (!userId) throw new HttpError(401, "Not authenticated");

      const {
        nic,
        address,
        age,
        licenseNumber,
        vehicleType,
        vehicleNumber,
        vehicleColor,
      } = req.body;

      // ✅ accept both names (frontend might send seatsTotal)
      const seatsRaw = req.body.totalSeats ?? req.body.seatsTotal;

      const ageNum = parseInt(String(age ?? ""), 10);
      const seatsNum = parseInt(String(seatsRaw ?? ""), 10);

      if (!Number.isFinite(ageNum) || ageNum < 18) throw new HttpError(400, "Invalid age");
      if (!Number.isFinite(seatsNum) || seatsNum < 1) throw new HttpError(400, "Invalid totalSeats");

      const vt = normalizeVehicleType(vehicleType);
      if (!vt) throw new HttpError(400, "Invalid vehicleType");

      const licenseImageUrl = req.files?.licenseImage?.[0]?.path ?? null;
      const vehiclePhotoUrl = req.files?.vehiclePhoto?.[0]?.path ?? null;

      if (!licenseImageUrl) throw new HttpError(400, "licenseImage is required");
      if (!vehiclePhotoUrl) throw new HttpError(400, "vehiclePhoto is required");

      const payload = {
        customerId: userId,
        status: "PENDING",
        driverId: null,
        nic,
        address,
        age: ageNum,
        licenseNumber,
        licenseImageUrl,
        vehicleType: vt,
        vehicleNumber,
        vehicleColor,
        totalSeats: seatsNum,
        vehiclePhotoUrl,
      };

      const doc = await DriverProfile.findOneAndUpdate(
        { customerId: userId },
        { $set: payload },
        { new: true, upsert: true, runValidators: true }
      );

      res.json({ ok: true, driver: doc });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
