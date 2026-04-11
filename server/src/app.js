// server/src/app.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

// core
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { usersRouter } from "./routes/users.routes.js";

// ride modules
import { offersRouter } from "./routes/offers.routes.js";
import { requestsRouter } from "./routes/requests.routes.js";
import { matchesRouter } from "./routes/matches.routes.js";
import { bookingsRouter } from "./routes/bookings.routes.js";     // ✅ added
import { paymentsRouter } from "./routes/payments.routes.js";     // ✅ added

// train modules
import { trainRouter } from "./modules/train/train.routes.js";
import { trainAdminRouter } from "./modules/train/train.admin.routes.js";

// bus modules
import busRouter from "./modules/bus/routes/bus.routes.js";
import geoRouter from "./routes/geo.routes.js";

// driver workflow
import { driverRegistrationRouter } from "./routes/driverRegistration.routes.js";
import { driverApprovalsRouter } from "./routes/driverApprovals.routes.js";

// bus owner workflow
import { busOwnerRouter } from "./routes/busOwner.routes.js";
import { busApprovalsRouter } from "./routes/busApprovals.routes.js";

// private/system admin router
import { adminRouter } from "./routes/admin.routes.js";

//reviews for private rides
import reviewRouter from "./routes/review.routes.js";

//carbon impact
import ecoRoutes from "./routes/eco.routes.js";
export function buildApp({ io }) {
  const app = express();

  // security + parsing
  app.use(
    helmet({
      // ✅ allow frontend on different origin/port to load uploaded images
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  // CORS
  const allowedOrigins = [
    process.env.CLIENT_ORIGIN || "http://localhost:5173",
    process.env.ADMIN_ORIGIN || "http://localhost:5174",
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // Postman / server-to-server
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    })
  );

  // rate limit
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 120 }));

  // attach socket.io
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // uploads
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // PUBLIC / AUTH
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);

  // DRIVER WORKFLOW
  app.use("/api/driver-registration", driverRegistrationRouter);

  // CORE (rides)
  app.use("/api/offers", offersRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/matches", matchesRouter);
  app.use("/api/bookings", bookingsRouter);   // ✅ added
  app.use("/api/payments", paymentsRouter);   // ✅ added

  //reviews
  app.use("/api/reviews", reviewRouter);

  // TRAIN
  app.use("/api/train", trainRouter);
  app.use("/api/admin/train", trainAdminRouter);

  // BUS + GEO
  app.use("/api/bus", busRouter);
  app.use("/api/geo", geoRouter);

  // BUS OWNER
  app.use("/api/bus-owner", busOwnerRouter);

  // ADMIN
  app.use("/api/admin", busApprovalsRouter);
  app.use("/api/admin", driverApprovalsRouter);
  app.use("/api/admin", adminRouter);

  //   CARBON IMPACT
  app.use("/api/eco", ecoRoutes);

  // error handler last
  app.use(errorHandler);

  return app;
}