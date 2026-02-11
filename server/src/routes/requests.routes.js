import { Router } from "express";
import { createRequest, myRequests } from "../controllers/request.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const requestsRouter = Router();

requestsRouter.post("/", requireAuth, createRequest);
requestsRouter.get("/my", requireAuth, myRequests);
