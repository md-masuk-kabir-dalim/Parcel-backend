import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { bookingService } from "./bookings.service";
import { UserRole } from "@prisma/client";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const bookingData = req.body;
  bookingData.userId = req.user.id;
  const result = await bookingService.createBooking(bookingData);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Booking created successfully",
    data: result,
  });
});

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;
  const patientId = role === UserRole.PATIENT ? id : undefined;
  const doctorId = role === UserRole.DOCTOR ? id : undefined;
  const result = await bookingService.getAllBookings(
    req.query,
    patientId,
    doctorId
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.getSingleBooking(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking retrieved successfully",
    data: result,
  });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const { role, id } = req.user;
  const result = await bookingService.updateBooking(
    req.params.id,
    req.body.status,
    role as UserRole,
    id as string
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking updated successfully",
    data: result,
  });
});

const deleteBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingService.deleteBooking(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Booking deleted successfully",
    data: result,
  });
});

const generateTimeSlots = catchAsync(async (req: Request, res: Response) => {
  const { date } = req.query;
  const doctorId = req.params.doctorId;

  if (!doctorId || typeof doctorId !== "string") {
    throw new ApiError(400, "doctorId is required");
  }

  if (!date || typeof date !== "string" || isNaN(Date.parse(date))) {
    throw new ApiError(400, "Valid date is required");
  }

  const result = await bookingService.generateTimeSlots(
    doctorId,
    new Date(date)
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Available time slots fetched successfully",
    data: result,
  });
});

export const bookingController = {
  createBooking,
  getAllBookings,
  getSingleBooking,
  updateBooking,
  deleteBooking,
  generateTimeSlots,
};
