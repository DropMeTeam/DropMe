import express from 'express';
import { 
  createReview, 
  updateReview, 
  deleteReview, 
  getDriverReviews // The aggregation function we built
} from '../controllers/reviewController.js';
// import { protect } from '../middleware/authMiddleware.js'; // Use your team's auth

const router = express.Router();

router.post('/submit', createReview); // Add 'protect' middleware here later
router.get('/driver/:driverId', getDriverReviews);
router.patch('/update/:id', updateReview);
router.delete('/delete/:id', deleteReview);
router.get('/stats/:driverId', getDriverStats);

export default router;