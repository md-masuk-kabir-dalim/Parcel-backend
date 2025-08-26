import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import httpStatus from "http-status";
import path from "path";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { xssSanitizerMiddleware } from "./app/middlewares/sanitizeInput";
import router from "./app/routes";
import { messagePersistenceQueue, otpQueue } from "./helpers/redis";
const app: express.Express = express();
const prisma = new PrismaClient();
app.disable("x-powered-by");
app.set("json spaces", 0);

const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://10.5.0.2:3000",
    "https://parcel-frontend.onrender.com",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true,
};

// Middleware setup
prisma
  .$connect()
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(hpp());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xssSanitizerMiddleware);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Route handler for root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Welcome to api main route",
  });
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(otpQueue),
    new BullMQAdapter(messagePersistenceQueue),
  ],
  serverAdapter,
});

// Mount the dashboard
app.use("/admin/queues", serverAdapter.getRouter());

// Router setup
app.use("/api/v1", router);

// Global Error Handler
app.use(GlobalErrorHandler);

// API Not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
