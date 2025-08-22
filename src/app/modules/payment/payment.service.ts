import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import { generateUniqueId } from "../../utils/generateUniqueId";
import sslClient from "../../utils/sslClient";
import { PaymentStatus } from "@prisma/client";
import config from "../../../config";

const createPaymentIntent = async (userId: string, bookingId: string) => {
  const booking = await prisma.doctorBooking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      amount: true,
      bookingType: true,
      isPayment: true,
      user: {
        select: {
          id: true,
          address: true,
          username: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.isPayment) {
    throw new ApiError(400, "Payment already completed for this booking");
  }

  const transitionId = generateUniqueId("tnx_");

  const paymentData = {
    total_amount: booking.amount,
    currency: "BDT",
    tran_id: transitionId,
    success_url: `${config.backend_base_url}/payment/success?transitionId=${transitionId}`,
    fail_url: `${config.backend_base_url}/payment/fail?transitionId=${transitionId}`,
    cancel_url: `${config.backend_base_url}/payment/fail?transitionId=${transitionId}`,
    ipn_url: `${config.backend_base_url}/webhook?transitionId=${transitionId}`,
    shipping_method: "Courier",
    product_name: "Doctor Service",
    product_category: "Health",
    product_profile: "general",
    cus_name: booking.user.username,
    cus_email: booking.user.email,
    cus_add1: "Bangladesh",
    cus_add2: "Bangladesh",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "1000",
    cus_phone: booking.user.phoneNumber,
    cus_fax: "N/A",
    ship_name: booking.user.username,
    ship_add1: "Bangladesh",
    ship_add2: "Bangladesh",
    ship_city: "Dhaka",
    ship_state: "Dhaka",
    ship_postcode: "1000",
    ship_country: "Bangladesh",
  };

  const apiResponse = await sslClient.init(paymentData);

  await prisma.payment.upsert({
    where: {
      bookingId,
    },
    create: {
      transitionId,
      amount: booking.amount,
      bookingId: bookingId,
      userId,
      bookingType: booking.bookingType,
    },
    update: {
      transitionId,
    },
  });
  return { paymentUrl: apiResponse?.redirectGatewayURL };
};

const handlePaymentWebhook = async (data: IPaymentWebhookData) => {
  const { status, tran_id } = data;

  if (!tran_id) {
    throw new ApiError(404, "Missing transaction ID");
  }

  // Mapping function
  const mapSSLStatusToPaymentStatus = (sslStatus: string): PaymentStatus => {
    switch (sslStatus) {
      case "VALID":
        return PaymentStatus.SUCCESS;
      case "FAILED":
      case "CANCELLED":
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  };

  // Map SSL status to PaymentStatus enum
  const paymentStatus = mapSSLStatusToPaymentStatus(status);

  const payment = await prisma.payment.update({
    where: { transitionId: tran_id },
    data: {
      paymentStatus: paymentStatus as PaymentStatus,
      booking: {
        update: {
          isPayment: true,
        },
      },
    },
  });

  return payment;
};

export const paymentService = {
  createPaymentIntent,
  handlePaymentWebhook,
};
