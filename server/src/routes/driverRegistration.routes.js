import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { getMyDriverRegistration, submitDriverRegistration } from "../controllers/driverRegistration.controller.js";

export const driverRegistrationRouter = Router();

driverRegistrationRouter.get("/me", requireAuth, getMyDriverRegistration);

driverRegistrationRouter.post(
  "/submit",
  requireAuth,
  upload.fields([
    { name: "licenseImage", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 },
  ]),
  submitDriverRegistration
);
