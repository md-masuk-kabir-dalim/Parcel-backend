import { OtpType, User } from "@prisma/client";
import bcrypt from "bcrypt";
import ApiError from "../errors/ApiErrors";
import prisma from "../shared/prisma";
import { generateOTP } from "./generateOtp";
import { otpQueue } from "./redis";

const OTP_EXPIRATION_MS = 10 * 60 * 1000;

interface SendOtpPayload {
  user: User;
  otpType: OtpType;
  identifier: string;
}

const generateAndQueueOtp = async ({
  user,
  identifier,
  otpType,
}: SendOtpPayload): Promise<string> => {
  if (!user.id || !user?.username) {
    throw new ApiError(400, "Missing user id or username for OTP generation");
  }

  const otpCode = generateOTP();

  // Run the rest of the OTP logic in the background
  setImmediate(async () => {
    try {
      const hashedOtpPromise = bcrypt.hash(otpCode, 2);
      const queuePromise = otpQueue.add("otp-queue", {
        userId: user.id,
        identifier,
        otpCode,
        username: user.username,
        otpType,
      });

      const [hashedOtp] = await Promise.all([hashedOtpPromise, queuePromise]);
      const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);

      // Store OTP in DB
      await prisma.otp.upsert({
        where: { userId: user.id },
        update: { otpCode: hashedOtp, expiresAt, type: otpType },
        create: {
          id: user.id,
          identifier,
          otpCode: hashedOtp,
          type: otpType,
          userId: user.id,
          expiresAt,
        },
      });
    } catch (err) {
      console.log("OTP generation or queue failed:", err);
    }
  });

  return otpCode;
};

export default generateAndQueueOtp;
