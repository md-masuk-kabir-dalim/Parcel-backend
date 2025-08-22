import express from "express";
import { bookingController } from "./bookings.controller";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { DoctorBookingValidation } from "./bookings.validation";

const router = express.Router();

router.get(
  "/time-slots/:doctorId",
  apiKeyMiddleware,
  auth(),
  bookingController.generateTimeSlots
);

router
  .route("/")
  .post(
    apiKeyMiddleware,
    auth(UserRole.PATIENT),
    validateRequest(DoctorBookingValidation.DoctorBookingSchema),
    bookingController.createBooking
  )
  .get(apiKeyMiddleware, auth(), bookingController.getAllBookings);

router
  .route("/:id")
  .patch(apiKeyMiddleware, auth(), bookingController.updateBooking)
  .delete(apiKeyMiddleware, auth(), bookingController.deleteBooking)
  .get(apiKeyMiddleware, auth(), bookingController.getSingleBooking);

export const bookingRoutes = router;
