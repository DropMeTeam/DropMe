import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT || 5000);

async function main() {
  await connectDB(process.env.MONGODB_URI);

  const httpServer = http.createServer();

  const io = new SocketIOServer(httpServer, {
    cors: { origin: process.env.CLIENT_ORIGIN || "http://localhost:5173", credentials: true }
  });

  io.on("connection", (socket) => {
    socket.on("auth:identify", ({ role, userId }) => {
      if (!userId) return;
      if (role === "driver") socket.join(`driver:${userId}`);
      socket.join(`rider:${userId}`);
    });
  });

  const app = buildApp({ io });
  httpServer.on("request", app);

  httpServer.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
