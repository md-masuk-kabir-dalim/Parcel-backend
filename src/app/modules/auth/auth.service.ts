import { OtpType, User, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { SignOptions } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import generateAndQueueOtp from "../../../helpers/generate.queue.otp";
import { jwtHelpers, TokenType } from "../../../helpers/jwtHelpers";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import prisma from "../../../shared/prisma";
import { LoginPayload } from "./auth.interface";

export enum LogInType {
  EMAIL = "email",
  PHONE = "phone",
}

enum OtpDeliveryType {
  EMAIL = "email",
  PHONE = "phone",
}

const loginWithPassword = async (payload: LoginPayload) => {
  const { email, password } = payload;
  const normalizedEmail = email?.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "We couldn't find an account with the provided credentials."
    );
  }

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is not active.");
  }

  if (!user.isVerify) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Account Not Found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Incorrect password. Please try again or reset your password."
    );
  }

  const accessToken = jwtHelpers.generateJwtToken(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      username: user.username,
    },
    TokenType.ACCESS_TOKEN,
    config.jwt.expires_in as SignOptions["expiresIn"]
  );

  return {
    role: user.role,
    accessToken,
  };
};

const sendOtpIntoDB = async (
  identifier: string,
  otpType: OtpType,
  deliveryType: OtpDeliveryType
) => {
  let user;

  switch (deliveryType) {
    case OtpDeliveryType.EMAIL: {
      const normalizedEmail = identifier.trim().toLowerCase();

      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "No account found with the provided email address."
        );
      }
      break;
    }

    case OtpDeliveryType.PHONE: {
      const phone = identifier.trim();
      user = await prisma.user.findUnique({
        where: { phoneNumber: phone },
      });

      if (!user) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "No account found with the provided phone number."
        );
      }
      break;
    }

    default:
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid OTP delivery method. Must be either EMAIL or PHONE."
      );
  }

  const otpCode = await generateAndQueueOtp({
    user,
    identifier,
    otpType,
  });

  const verifyToken = jwtHelpers.generateJwtToken(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      username: user.username,
      otpType,
    },
    otpType === OtpType.PASSWORD_RESET
      ? TokenType.PASSWORD_RESET
      : TokenType.VERIFICATION,
    "5m" as SignOptions["expiresIn"]
  );

  return {
    otpCode,
    verifyToken,
    role: user?.role,
  };
};

const verifyOtpCodeDB = async (
  userId: string,
  otpCode: string,
  otpType: OtpType
) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      gender: true,
      email: true,
      status: true,
      phoneNumber: true,
      role: true,
      address: true,
      dateOfBirth: true,
      otp: {
        select: {
          id: true,
          otpCode: true,
          type: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  const otpRecord = userData.otp;

  if (!otpRecord) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "OTP is missing or already used."
    );
  }

  const {
    otpCode: hashedOtp,
    expiresAt,
    id: otpId,
    type: storedOtpType,
  } = otpRecord;

  if (storedOtpType !== otpType) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP type mismatch.");
  }

  const isOtpValid = await bcrypt.compare(otpCode, hashedOtp);
  if (!isOtpValid) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "The OTP you entered is incorrect."
    );
  }

  const currentTime = Date.now();
  if (currentTime > expiresAt.getTime()) {
    await prisma.otp.delete({ where: { id: otpId } });
    throw new ApiError(
      httpStatus.GONE,
      "OTP has expired. Please request a new one."
    );
  }

  setImmediate(async () => {
    await prisma.$transaction([
      prisma.otp.delete({ where: { id: otpId } }),
      prisma.user.update({
        where: { id: userId },
        data: { isVerify: true },
      }),
    ]);
  });

  const token = jwtHelpers.generateJwtToken(
    {
      id: userData.id,
      email: userData.email,
      phoneNumber: userData.phoneNumber ?? undefined,
      role: userData.role,
      username: userData.username,
    },
    otpType === OtpType.PASSWORD_RESET
      ? TokenType.PASSWORD_RESET
      : TokenType.ACCESS_TOKEN,
    config.jwt.expires_in as SignOptions["expiresIn"]
  );

  return otpType === OtpType.PASSWORD_RESET
    ? { verifyToken: token, role: userData?.role }
    : { accessToken: token, role: userData?.role };
};

const resetPasswordIntoDB = async (userId: string, newPassword: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found for reset password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  const accessToken = jwtHelpers.generateJwtToken(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user?.phoneNumber ?? undefined,
      role: user.role,
      username: user?.username,
    },
    TokenType.ACCESS_TOKEN,
    config.jwt.expires_in as SignOptions["expiresIn"]
  );

  return {
    accessToken,
  };
};

const getProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      avatar: true,
      address: true,
      gender: true,
      dateOfBirth: true,
      phoneNumber: true,
      email: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "user not found!");
  }
  return {
    userInfo: user,
  };
};

const updateProfileIntoDB = async (userId: string, userData: User) => {
  const { email, ...rest } = userData;
  await prisma.user.update({
    where: { id: userId },
    data: rest,
  });
  return;
};

const updateProfileImageIntoDB = async (
  userId: string,
  file: Express.Multer.File
) => {
  const imageUrl = await uploadToDigitalOcean(file, "avatar");
  await prisma.user.update({
    where: { id: userId },
    data: { avatar: imageUrl },
  });

  return;
};

const deleteAccount = async (userId: string) => {
  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return;
};

export const authService = {
  loginWithPassword,
  getProfileFromDB,
  updateProfileIntoDB,
  sendOtpIntoDB,
  verifyOtpCodeDB,
  updateProfileImageIntoDB,
  resetPasswordIntoDB,
  deleteAccount,
};
