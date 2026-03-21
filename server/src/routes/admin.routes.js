// server/src/routes/admin.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { me } from "../controllers/auth.controller.js";

export const adminRouter = Router();

// Optional: keep this if you use it anywhere
adminRouter.get("/me", requireAuth, me);
