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
import { errorHandler } from "./middleware/errorHandler.js";

export function buildApp({ io }) {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));

  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  app.use(cors({ origin, credentials: true }));

  app.use(rateLimit({ windowMs: 60 * 1000, limit: 120 }));

  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/offers", offersRouter);
  app.use("/api/requests", requestsRouter);
  app.use("/api/matches", matchesRouter);

  app.use(errorHandler);

  return app;
}
