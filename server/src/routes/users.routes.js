import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { getMe, updateMe } from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, getMe);

// profile update: name + avatar image
usersRouter.patch("/me", requireAuth, upload.single("avatar"), updateMe);
