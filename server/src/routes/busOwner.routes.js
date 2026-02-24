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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ LIST MY BUSES (this removes your 404)
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

// ✅ CREATE BUS (multipart upload)
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

      const seats = Number(seatsTotal);
      if (!Number.isFinite(seats) || seats < 25 || seats > 60) {
        return res.status(400).json({ message: "Seats must be between 25 and 60" });
      }

      if (!routeId) return res.status(400).json({ message: "routeId is required" });

      // ✅ enforce: route must exist (admin-created route)
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

      const created = await Bus.create({
        owner: ownerId,
        plateNumber: plate,
        busType,
        color,
        seatsTotal: seats,
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