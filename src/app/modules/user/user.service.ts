import { AuthProvider, OtpType, Prisma, User, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import prisma from "../../../shared/prisma";
import { generateUUID } from "../../utils/generateUUID";
import generateAndQueueOtp from "../../../helpers/generate.queue.otp";
import { jwtHelpers, TokenType } from "../../../helpers/jwtHelpers";
import { SignOptions } from "jsonwebtoken";

const handleExistingUserVerification = async (
  user: User,
  conflictMessage: string
) => {
  if (!user.isVerify) {
    const otpCode = await generateAndQueueOtp({
      user,
      identifier: user.email,
      otpType: OtpType.EMAIL_VERIFICATION,
    });

    const verifyToken = jwtHelpers.generateJwtToken(
      {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        username: user.username,
        otpType: OtpType.EMAIL_VERIFICATION,
      },
      TokenType.VERIFICATION,
      "5m" as SignOptions["expiresIn"]
    );

    return {
      otpCode,
      verifyToken,
      role: user?.role,
    };
  }
  throw new ApiError(httpStatus.CONFLICT, `${conflictMessage} already exists!`);
};

const createUserIntoDB = async (payload: User) => {
  const normalizedEmail = payload.email?.trim().toLowerCase();
  const [existingEmailAuth, existingPhoneAuth] = await Promise.all([
    prisma.user.findUnique({
      where: { email: normalizedEmail },
    }),
    prisma.user.findUnique({
      where: { phoneNumber: payload.phoneNumber },
    }),
  ]);

  if (existingEmailAuth) {
    return await handleExistingUserVerification(existingEmailAuth, "Email");
  }

  if (existingPhoneAuth) {
    return await handleExistingUserVerification(
      existingPhoneAuth,
      "Phone Number"
    );
  }

  const hashedPassword = await bcrypt.hash(payload.password as string, 4);
  const userId = generateUUID();

  const user = await prisma.user.create({
    data: {
      id: userId,
      username: payload.username,
      email: normalizedEmail,
      password: hashedPassword,
      role: payload?.role,
      provider: AuthProvider.EMAIL,
      phoneNumber: payload.phoneNumber,
    },
  });

  const otpCode = await generateAndQueueOtp({
    user,
    identifier: user.email,
    otpType: OtpType.EMAIL_VERIFICATION,
  });

  const verifyToken = jwtHelpers.generateJwtToken(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      username: user.username,
      otpType: OtpType.EMAIL_VERIFICATION,
    },
    TokenType.VERIFICATION,
    "5m" as SignOptions["expiresIn"]
  );

  return {
    otpCode,
    verifyToken,
    role: user?.role,
  };
};

const getSingleUserIntoDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      address: true,
      email: true,
      phoneNumber: true,
      avatar: true,
      dateOfBirth: true,
      gender: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "user not found!");
  }
  return user;
};

const getUsersIntoDB = async (
  page: number,
  limit: number,
  searchQuery: string,
  role: UserRole
) => {
  const additionalFilter: Prisma.UserWhereInput = {
    isVerify: true,
  };

  if (role) {
    additionalFilter.role = role;
  }

  const users = await searchAndPaginate<
    User,
    Prisma.UserWhereInput,
    Prisma.UserSelect,
    Prisma.UserInclude,
    Prisma.UserOrderByWithRelationInput
  >({
    model: prisma.user,
    searchableFields: ["email", "username", "phoneNumber"],
    page,
    limit,
    searchQuery,
    additionalFilter,
    selectFields: {
      id: true,
      avatar: true,
      username: true,
      email: true,
      createdAt: true,
      gender: true,
      address: true,
      dateOfBirth: true,
      phoneNumber: true,
      role: true,
    },
  });

  return { userInfo: users, meta: users.meta };
};

const updateUserIntoDB = async (id: string, userData: any) => {
  await prisma.user.update({
    where: { id },
    data: userData,
  });

  return;
};

const deleteUserIntoDB = async (userId: string, loggedId: string) => {
  if (userId === loggedId) {
    throw new ApiError(403, "You can't delete your own account!");
  }
  const existingUser = await getSingleUserIntoDB(userId);
  if (!existingUser) {
    throw new ApiError(404, "user not found for delete this");
  }
  await prisma.user.delete({
    where: { id: userId },
  });
  return;
};

export const userService = {
  createUserIntoDB,
  getUsersIntoDB,
  getSingleUserIntoDB,
  updateUserIntoDB,
  deleteUserIntoDB,
};
