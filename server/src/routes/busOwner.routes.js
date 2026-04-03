import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Bus } from "../models/Bus.js";
import BusRoute from "../modules/bus/models/BusRoute.js";

const router = Router();

// storage to /uploads/buses
const uploadDir = path.join(process.cwd(), "uploads", "buses");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const ALLOWED_SEATS = {
  Normal: [42, 44, 49, 54],
  "Semi-luxury": [32, 35, 40],
  Luxury: [45, 49, 50],
  Expressway: [32, 35, 40, 45, 49, 50],
};

// LIST MY BUSES
router.get("/buses", requireAuth, requireRole("BUS_OWNER"), async (req, res, next) => {
  try {
    const ownerId = req.user?.sub || req.user?.id;
    if (!ownerId) return res.status(401).json({ message: "Invalid session user" });

    const buses = await Bus.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .populate("routeId", "routeNumber routeType start end")
      .lean();

    res.json({ buses });
  } catch (e) {
    next(e);
  }
});

// CREATE BUS
router.post(
  "/buses",
  requireAuth,
  requireRole("BUS_OWNER"),
  upload.fields([
    { name: "busPhoto", maxCount: 1 },
    { name: "registrationPhoto", maxCount: 1 },
    { name: "permitPhoto", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const ownerId = req.user?.sub || req.user?.id;
      if (!ownerId) return res.status(401).json({ message: "Invalid session user" });

      const { plateNumber, busType, color, seatsTotal, routeId } = req.body;

      const plate = String(plateNumber || "").trim().toUpperCase();
      if (!plate) return res.status(400).json({ message: "plateNumber is required" });

      const safeBusType = String(busType || "Normal");
      if (!ALLOWED_SEATS[safeBusType]) {
        return res.status(400).json({ message: "Invalid busType" });
      }

      const seats = Number(seatsTotal);
      if (!ALLOWED_SEATS[safeBusType].includes(seats)) {
        return res.status(400).json({
          message: `Invalid seat count for ${safeBusType}. Allowed: ${ALLOWED_SEATS[safeBusType].join(", ")}`
        });
      }

      if (!routeId) return res.status(400).json({ message: "routeId is required" });

      const route = await BusRoute.findById(routeId).lean();
      if (!route) return res.status(400).json({ message: "Invalid routeId (route not found)" });

      const busPhoto = req.files?.busPhoto?.[0];
      const regPhoto = req.files?.registrationPhoto?.[0];
      const permitPhoto = req.files?.permitPhoto?.[0];

      if (!busPhoto) return res.status(400).json({ message: "busPhoto is required" });
      if (!regPhoto) return res.status(400).json({ message: "registrationPhoto is required" });
      if (!permitPhoto) return res.status(400).json({ message: "permitPhoto is required" });

      const photoUrl = `/uploads/buses/${busPhoto.filename}`;
      const registrationPhotoUrl = `/uploads/buses/${regPhoto.filename}`;
      const permitPhotoUrl = `/uploads/buses/${permitPhoto.filename}`;

      // supports features[] from frontend FormData
      const rawFeatures = req.body.features;
      const features = Array.isArray(rawFeatures)
        ? rawFeatures.map((f) => String(f).trim()).filter(Boolean)
        : rawFeatures
          ? [String(rawFeatures).trim()].filter(Boolean)
          : [];

      const created = await Bus.create({
        owner: ownerId,
        plateNumber: plate,
        busType: safeBusType,
        color,
        seatsTotal: seats,
        features,
        routeId,
        photoUrl,
        registrationPhotoUrl,
        permitPhotoUrl,
        status: "pending",
      });

      res.json({ bus: created });
    } catch (e) {
      next(e);
    }
  }
);

export { router as busOwnerRouter };