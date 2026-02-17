import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import express from "express";

import { connectDB } from "./config/db.js";
import { buildApp } from "./app.js";

import driverRoutes from "./routes/driverRoutes.js";
import adminDriverRoutes from "./routes/adminDriverRoutes.js";
import rideRoutes from "./routes/rideRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

const PORT = Number(process.env.PORT || 5000);

async function main() {
  await connectDB(process.env.MONGODB_URI);

  let app; // will be assigned after io is created

  const httpServer = http.createServer((req, res) => {
    if (!app) {
      res.statusCode = 503;
      res.end("Server is starting...");
      return;
    }
    return app(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("auth:identify", ({ role, userId }) => {
      if (!userId) return;
      if (role === "driver") socket.join(`driver:${userId}`);
      socket.join(`rider:${userId}`);
    });
  });

  // ✅ Build express app
  app = buildApp({ io });

  // ✅ IMPORTANT: mount routes HERE (not outside main)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use("/api/driver", driverRoutes);
  app.use("/api/private-admin", adminDriverRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/bookings", bookingRoutes);

  httpServer.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
