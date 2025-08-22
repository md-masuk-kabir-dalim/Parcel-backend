import {
  AuthProvider,
  Diagnostic,
  Prisma,
  User,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcrypt";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import prisma from "../../../shared/prisma";
import { DiagnosticInput, diagnosticLoginInput } from "./diagnostic.validation";
import { generateUniqueId } from "../../utils/generateUniqueId";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { jwtHelpers, TokenType } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { SignOptions } from "jsonwebtoken";
import { generateUUID } from "../../utils/generateUUID";

const createDiagnostic = async (
  payload: DiagnosticInput,
  file: Express.Multer.File
) => {
  const { password } = payload;
  const logo = await uploadToDigitalOcean(file, "diagnostic_logo");
  const id = generateUUID();
  const hashedPassword = await bcrypt.hash(password, 4);
  const diagnostic = await prisma.user.create({
    data: {
      id: id,
      avatar: logo,
      password: hashedPassword,
      provider: AuthProvider.EMAIL,
      uniqueId: generateUniqueId("DA-"),
      address: payload.address,
      dateOfBirth: payload.dateOfBirth,
      username: payload.ownerName,
      isVerify: true,
      role: UserRole.DIAGNOSTIC,
      phoneNumber: payload.phoneNumber,
      email: payload.email,
      diagnostic: {
        create: {
          id,
          name: payload.name,
          tradeLicense: payload.tradeLicense,
          type: payload.type,
        },
      },
    },
  });

  const accessToken = jwtHelpers.generateJwtToken(
    {
      id: diagnostic.id,
      email: diagnostic.email,
      username: diagnostic.username,
      phoneNumber: diagnostic.phoneNumber,
      role: UserRole.DIAGNOSTIC,
    },
    TokenType.ACCESS_TOKEN,
    config.jwt.expires_in as SignOptions["expiresIn"]
  );

  return {
    accessToken,
  };
};

const diagnosticLogin = async (payload: diagnosticLoginInput) => {
  const diagnostic = await prisma.user.findUnique({
    where: {
      email: payload.email,
      uniqueId: payload.diagnosticID,
    },
  });

  if (!diagnostic) {
    throw new ApiError(400, "Diagnostic Not Found");
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    diagnostic?.password
  );

  if (!isPasswordValid) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Incorrect password. Please try again or reset your password."
    );
  }

  const accessToken = jwtHelpers.generateJwtToken(
    {
      id: diagnostic.id,
      email: diagnostic.email,
      username: diagnostic.username,
      phoneNumber: diagnostic.phoneNumber,
      role: UserRole.DIAGNOSTIC,
    },
    TokenType.ACCESS_TOKEN,
    config.jwt.expires_in as SignOptions["expiresIn"]
  );

  return {
    accessToken,
  };
};

const updateDiagnostic = async (
  id: string,
  payload: Partial<DiagnosticInput>,
  file?: Express.Multer.File
) => {
  let avatar;
  if (file) {
    avatar = await uploadToDigitalOcean(file, "avatar");
  }

  const updateData: any = {
    ...(avatar && { avatar }),
    ...(payload.email && { email: payload.email }),
    ...(payload.phoneNumber && { phoneNumber: payload.phoneNumber }),
    ...(payload.ownerName && { username: payload.ownerName }),
    ...(payload.address && { address: payload.address }),
    ...(payload.dateOfBirth && { dateOfBirth: payload.dateOfBirth }),
  };

  await prisma.user.update({
    where: { id },
    data: {
      ...updateData,
      diagnostic: {
        update: {
          ...(payload.name && { name: payload.name }),
          ...(payload.tradeLicense && { tradeLicense: payload.tradeLicense }),
          ...(payload.type && { type: payload.type }),
        },
      },
    },
  });
};

const getSingleDiagnostic = async (id: string) => {
  const diagnostic = await prisma.diagnostic.findUnique({
    where: {
      id,
    },
  });

  return diagnostic;
};

const getAllDiagnostic = async (
  page: number,
  limit: number,
  searchQuery: string
) => {
  const additionalFilter: Prisma.UserWhereInput = {};
  const diagnostic = await searchAndPaginate<
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
      uniqueId: true,
      username: true,
      avatar: true,
      email: true,
      phoneNumber: true,
      address: true,
      dateOfBirth: true,
      diagnostic: {
        select: {
          tradeLicense: true,
          name: true,
        },
      },
    },
  });

  return diagnostic;
};

export const diagnosticService = {
  createDiagnostic,
  updateDiagnostic,
  getAllDiagnostic,
  getSingleDiagnostic,
  diagnosticLogin,
};
