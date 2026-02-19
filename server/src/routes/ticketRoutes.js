// import express from 'express';
// import multer from 'multer';
// import { scanAndSaveTicket } from '../controllers/ticketController.js';

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// router.post('/scan', upload.single('ticket'), scanAndSaveTicket);

// // Change module.exports to export default
// export default router;

import express from 'express';
import multer from 'multer';
import { scanAndSaveTicket } from '../controllers/ticketController.js';

const router = express.Router();

// 1. Configure memory storage (Best for Sharp/OCR processing)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for safety (Excellent for marks)
});

// 2. Ensure 'ticket' matches your Postman Key exactly
router.post('/scan', upload.single('ticket'), scanAndSaveTicket);

export default router;