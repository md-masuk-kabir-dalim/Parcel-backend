import express from "express";
import { paymentController } from "./payment.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/create-intent",
  auth(UserRole.PATIENT),
  paymentController.createPaymentIntent
);

export const paymentRoutes = router;
