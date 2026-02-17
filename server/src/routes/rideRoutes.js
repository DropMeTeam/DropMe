import express from "express";
import { requireAuth, allowRoles } from "../middleware/auth.js";
import { createRide, myRides, searchRides } from "../controllers/rideController.js";

const router = express.Router();

router.get("/search", requireAuth, searchRides);
router.get("/mine", requireAuth, allowRoles("driver"), myRides);
router.post("/", requireAuth, allowRoles("driver"), createRide);

export default router;
