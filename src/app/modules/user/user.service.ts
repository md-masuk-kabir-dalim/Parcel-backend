import {
  AuthProvider,
  Prisma,
  User,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import prisma from "../../../shared/prisma";
import { generateUUID } from "../../utils/generateUUID";
import { generateUniqueId } from "../../utils/generateUniqueId";
import { doctorInput } from "./user.validation";

const handleExistingUserVerification = async (
  user: User,
  conflictMessage: string
) => {
  if (!user.isVerify) {
    return;
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

  const hashedPassword = await bcrypt.hash(payload.password as string, 2);
  const userId = generateUUID();

  await prisma.user.create({
    data: {
      id: userId,
      username: payload.username,
      email: normalizedEmail,
      password: hashedPassword,
      role: payload?.role,
      uniqueId: generateUniqueId("PT-"),
      provider: AuthProvider.EMAIL,
      phoneNumber: payload.phoneNumber,
      dateOfBirth: payload.dateOfBirth,
    },
  });

  return;
};

const createDoctorIntoDB = async (
  payload: doctorInput,
  bmdcFile: Express.Multer.File,
  certificateFile: Express.Multer.File,
  avatarFile: Express.Multer.File
) => {
  const {
    email,
    phoneNumber,
    password,
    designation,
    specialization,
    visitingPrice,
    experience,
    hospital,
    BMDC_No,
    day,
    endTime,
    startTime,
    qualifications,
    ...userFields
  } = payload;
  const normalizedEmail = email.trim().toLowerCase();
  const [existingEmailAuth, existingPhoneAuth] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail } }),
    prisma.user.findUnique({ where: { phoneNumber } }),
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

  const hashedPassword = await bcrypt.hash(password, 6);
  const userId = generateUUID();
  const [avatar, bmdcFileUrl, certificateUrl] = await Promise.all([
    uploadToDigitalOcean(avatarFile, "avatar"),
    uploadToDigitalOcean(bmdcFile, "bmd_file"),
    uploadToDigitalOcean(certificateFile, "certificate_File"),
  ]);

  await prisma.user.create({
    data: {
      id: userId,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      avatar,
      status: UserStatus.DEACTIVATE,
      role: UserRole.DOCTOR,
      uniqueId: generateUniqueId("DT-"),
      provider: AuthProvider.EMAIL,
      ...userFields,
      doctor: {
        create: {
          id: userId,
          designation,
          specialization,
          visitingPrice: Number(visitingPrice),
          experience: Number(experience),
          hospital,
          bmdcFileUrl,
          certificateUrl,
          endTime,
          startTime,
          BMDC_No,
          day,
          qualifications,
        },
      },
    },
  });

  return;
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
      bloodGroup: true,
      dateOfBirth: true,
      gender: true,
      role: true,
      uniqueId: true,
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
  searchQuery: string
) => {
  const additionalFilter: Prisma.UserWhereInput = {
    role: UserRole.PATIENT,
  };

  const users = await searchAndPaginate<
    User,
    Prisma.UserWhereInput,
    Prisma.UserSelect,
    Prisma.UserInclude,
    Prisma.UserOrderByWithRelationInput
  >({
    model: prisma.user,
    searchableFields: ["email", "username", "phoneNumber", "uniqueId"],
    page,
    limit,
    searchQuery,
    additionalFilter,
    selectFields: {
      id: true,
      avatar: true,
      username: true,
      uniqueId: true,
      email: true,
      createdAt: true,
      gender: true,
      address: true,
      dateOfBirth: true,
      bloodGroup: true,
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

const getDoctorList = async (
  page: number,
  limit: number,
  status: UserStatus,
  searchQuery: string
) => {
  const additionalFilter: Prisma.UserWhereInput = {
    role: UserRole.DOCTOR,
    ...(status && { status }),
  };
  const users = await searchAndPaginate<
    User,
    Prisma.UserWhereInput,
    Prisma.UserSelect,
    Prisma.UserInclude,
    Prisma.UserOrderByWithRelationInput
  >({
    model: prisma.user,
    searchableFields: ["username", "uniqueId"],
    page,
    limit,
    searchQuery,
    additionalFilter,
    selectFields: {
      id: true,
      avatar: true,
      username: true,
      email: true,
      uniqueId: true,
      phoneNumber: true,
      dateOfBirth: true,
      doctor: {
        select: {
          designation: true,
          BMDC_No: true,
          experience: true,
          specialization: true,
          visitingPrice: true,
        },
      },
    },
  });

  return { doctorInfo: users, meta: users.meta };
};

const getSingleDoctor = async (id: string) => {
  const doctor = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      uniqueId: true,
      avatar: true,
      address: true,
      doctor: {
        select: {
          id: true,
          designation: true,
          specialization: true,
          averageRating: true,
          visitingPrice: true,
          experience: true,
          BMDC_No: true,
          day: true,
          endTime: true,
          bmdcFileUrl: true,
          certificateUrl: true,
          startTime: true,
          qualifications: true,
          hospital: true,
        },
      },
    },
  });

  if (!doctor) {
    throw new ApiError(404, "user not found!");
  }

  return doctor;
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

const doctorStatusUpdate = async (userId: string, status: UserStatus) => {
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: status,
    },
  });
};

export const userService = {
  createUserIntoDB,
  getUsersIntoDB,
  getSingleUserIntoDB,
  updateUserIntoDB,
  deleteUserIntoDB,
  createDoctorIntoDB,
  getDoctorList,
  getSingleDoctor,
  doctorStatusUpdate,
};
