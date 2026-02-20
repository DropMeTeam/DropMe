import express from 'express';
import { createReview, getDriverStats } from '../controllers/reviewController.js';
// import { protect } from '../middleware/authMiddleware.js'; // Use your team's auth

const router = express.Router();

router.post('/', createReview); // Add 'protect' middleware here later
router.get('/stats/:driverId', getDriverStats);

export default router;