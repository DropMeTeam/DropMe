import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { createBooking, myBookings } from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", requireAuth, createBooking);
router.get("/mine", requireAuth, myBookings);

export default router;
