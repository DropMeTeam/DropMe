import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT || 5000);

async function main() {
  await connectDB(process.env.MONGODB_URI);

  // 1) Build Express first
  const app = buildApp();

  // 2) Create HTTP server WITH Express handler
  const httpServer = http.createServer(app);

  // 3) Attach Socket.IO (engine.io will wrap the request handler correctly)
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  // 4) Make io available to routes/controllers
  app.locals.io = io;

  io.on("connection", (socket) => {
    socket.on("auth:identify", ({ role, userId }) => {
      if (!userId) return;
      if (role === "driver") socket.join(`driver:${userId}`);
      socket.join(`rider:${userId}`);
    });
  });

  httpServer.listen(PORT, () =>
    console.log(`[server] http://localhost:${PORT}`)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});