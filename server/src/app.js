import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { authRouter } from "./routes/auth.routes.js";
import { offersRouter } from "./routes/offers.routes.js";
import { requestsRouter } from "./routes/requests.routes.js";
import { matchesRouter } from "./routes/matches.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { trainRouter } from "./modules/train/train.routes.js";
import { trainAdminRouter } from "./modules/train/train.admin.routes.js";

import { adminRouter } from "./routes/admin.routes.js";
import busRouter from "./modules/bus/routes/bus.routes.js";
import geoRouter from "./routes/geo.routes.js";

// ✅ user + driver workflow
import { usersRouter } from "./routes/users.routes.js";
import { driverRegistrationRouter } from "./routes/driverRegistration.routes.js";
import { driverApprovalsRouter } from "./routes/driverApprovals.routes.js";

// ✅ bus owner + bus approvals
import { busOwnerRouter } from "./routes/busOwner.routes.js";
import { busApprovalsRouter } from "./routes/busApprovals.routes.js";

export function buildApp({ io }) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  const allowedOrigins = [
    process.env.CLIENT_ORIGIN || "http://localhost:5173",
    process.env.ADMIN_ORIGIN || "http://localhost:5174",
  ];

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(rateLimit({ windowMs: 60 * 1000, limit: 120 }));

  // attach socket.io to req
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // serve uploaded images
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // =========================
  // AUTH + USER
  // =========================
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);

  // driver registration submit + status
  app.use("/api/driver-registration", driverRegistrationRouter);

  // =========================
  // CORE APP MODULES
  // =========================
  app.use("/api/offers", offersRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/matches", matchesRouter);

  // =========================
  // TRAIN MODULE
  // =========================
  app.use("/api/train", trainRouter);
  app.use("/api/admin/train", trainAdminRouter);

  // =========================
  // ADMIN MODULES
  // =========================
  // NOTE: Each router is mounted once.
 app.use("/api/admin", busApprovalsRouter);     // ✅ MUST be first
app.use("/api/admin", driverApprovalsRouter);  // optional
app.use("/api/admin", adminRouter);            // ✅ last (private-admin guarded)
  // =========================
  // BUS OWNER MODULE
  // =========================
  app.use("/api/bus-owner", busOwnerRouter);

  // =========================
  // BUS + GEO MODULES
  // =========================
  app.use("/api/bus", busRouter);
  app.use("/api/geo", geoRouter);

  // error handler last
  app.use(errorHandler);

  return app;
}