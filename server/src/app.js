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

import { usersRouter } from "./routes/users.routes.js";
import { driverRegistrationRouter } from "./routes/driverRegistration.routes.js";
import { driverApprovalsRouter } from "./routes/driverApprovals.routes.js";

import { bookingsRouter } from "./routes/bookings.routes.js";
import { paymentsRouter } from "./routes/payments.routes.js";

// Keep these bus-related imports if you are keeping the bus module
import { busRouter } from "./modules/bus/routes/bus.routes.js";
import { geoRouter } from "./routes/geo.routes.js";
import { busOwnerRouter } from "./routes/busOwner.routes.js";
import { busApprovalsRouter } from "./routes/busApprovals.routes.js";

export function buildApp({ io }) {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

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

  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Public / auth
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);

  // Driver workflow
  app.use("/api/driver-registration", driverRegistrationRouter);

  // Core ride flow
  app.use("/api/offers", offersRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/matches", matchesRouter);

  // Ride bookings + payments
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/payments", paymentsRouter);

  // Train
  app.use("/api/train", trainRouter);
  app.use("/api/admin/train", trainAdminRouter);

  // Bus + geo
  app.use("/api/bus", busRouter);
  app.use("/api/geo", geoRouter);

  // Bus owner
  app.use("/api/bus-owner", busOwnerRouter);

  // Admin
  // Keep specific admin modules BEFORE the general admin router
  app.use("/api/admin", busApprovalsRouter);
  app.use("/api/admin", driverApprovalsRouter);
  app.use("/api/admin", adminRouter);

  app.use(errorHandler);
  return app;
}