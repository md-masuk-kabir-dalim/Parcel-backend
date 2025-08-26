import http, { Server } from "http";
import app from "./app";
import config from "./config";
import CacheableLookup from "cacheable-lookup";
import { redis } from "./helpers/redis";
import socketConnect from "./socket";

// ✅ Enable DNS caching
const cacheable = new CacheableLookup();
cacheable.install(require("http").globalAgent);
cacheable.install(require("https").globalAgent);

let server: Server;

async function main() {
  try {
    const pong = await redis.ping();
    if (pong === "PONG") {
      console.log("✅ Redis Connected Successfully!");
    }

    // ✅ Create custom HTTP server for advanced config
    server = http.createServer(app);

    // ✅ Enable Keep-Alive and headers timeout
    server.keepAliveTimeout = 60 * 1000;
    server.headersTimeout = 65 * 1000;

    server.listen(config.port, () => {
      console.log("✅ Server is running on port", config.port);
    });

    // ✅ Socket connection
    socketConnect(server);

    // ✅ Graceful shutdown handler
    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.info("🔻 Server closed!");
        });
      }
      process.exit(1);
    };

    process.on("uncaughtException", (error) => {
      console.error("❗ Uncaught Exception:", error);
      exitHandler();
    });

    process.on("unhandledRejection", (error) => {
      console.error("❗ Unhandled Rejection:", error);
      exitHandler();
    });
  } catch (error) {
    console.error("❗ Failed to start application:", error);
    process.exit(1);
  }
}

main();
