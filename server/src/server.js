import "dotenv/config";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { connectDB } from "./config/db.js";
import { buildApp } from "./app.js";
import { getAllowedCorsOrigins } from "./utils/corsOrigins.js";

const PORT = Number(process.env.PORT || 5000);

async function main() {
  await connectDB(process.env.MONGODB_URI);

  let app;

  const httpServer = http.createServer((req, res) => {
    if (!app) {
      res.statusCode = 503;
      res.end("Server is starting...");
      return;
    }

    return app(req, res);
  });

  const allowedOrigins = getAllowedCorsOrigins();

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by Socket.IO CORS"));
      },
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

  app = buildApp({ io });

  httpServer.listen(PORT, () => {
    console.log(`[server] http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});