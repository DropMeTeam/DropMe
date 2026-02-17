import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { buildApp } from "./app.js";


const PORT = Number(process.env.PORT || 5000);

async function main() {
  await connectDB(process.env.MONGODB_URI);

  // IMPORTANT: create the HTTP server with a single request handler that delegates to Express
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
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("auth:identify", ({ role, userId }) => {
      if (!userId) return;
      if (role === "driver") socket.join(`driver:${userId}`);
      socket.join(`rider:${userId}`);
    });
  });

  // now build express app (single handler)
  app = buildApp({ io });

  httpServer.listen(PORT, () => console.log(`[server] http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
