import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { paymentService } from "./payment.service";
import ApiError from "../../../errors/ApiErrors";

const createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.body;
  const userId = req.user.id;

  if (!bookingId) {
    throw new ApiError(400, "Booking ID is required");
  }

  const paymentUrl = await paymentService.createPaymentIntent(
    userId,
    bookingId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment URL generated successfully",
    data: { paymentUrl },
  });
});

const paymentWebhook = catchAsync(async (req: Request, res: Response) => {
  const webhookData = req.body;
  await paymentService.handlePaymentWebhook(webhookData);
  res.status(200).send("IPN Received");
});

export const paymentController = {
  createPaymentIntent,
  paymentWebhook,
};
