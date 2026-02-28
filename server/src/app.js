import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth.routes.js";
import { offersRouter } from "./routes/offers.routes.js";
import { requestsRouter } from "./routes/requests.routes.js";
import { matchesRouter } from "./routes/matches.routes.js";

import ticketRoutes from "./routes/ticketRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

import errorHandler from "./middleware/errorHandler.js";

export function buildApp() {
  const app = express();

  // Security + parsing
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  // CORS
  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  app.use(cors({ origin, credentials: true }));

  // Rate limit
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 120 }));

  /**
   * Socket.IO access pattern:
   * - server.js sets app.locals.io = io
   * - every request gets req.io from app.locals
   */
  app.use((req, _res, next) => {
    req.io = req.app.locals.io; // may be undefined until server sets it (safe)
    next();
  });

  // Health
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Routes
  app.use("/api/auth", authRouter);
  app.use("/api/offers", offersRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/matches", matchesRouter);

  app.use("/api/tickets", ticketRoutes);
  app.use("/api/reviews", reviewRoutes);

  // Optional: consistent 404
  app.use((req, res) => {
    res.status(404).json({ ok: false, message: "Not found" });
  });

  // Error handler MUST be last
  app.use(errorHandler);

  return app;
}