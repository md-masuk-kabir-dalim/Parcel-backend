import prisma from "../../../shared/prisma";
import { PrescriptionInput } from "./prescription.validation";
import ApiError from "../../../errors/ApiErrors";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";
import { Prescription, Prisma } from "@prisma/client";
import searchAndPaginate from "../../../helpers/searchAndPaginate";

const createPrescription = async (
  doctorId: string,
  payload: PrescriptionInput,
  file: Express.Multer.File
) => {
  if (!file) {
    throw new ApiError(400, "Prescription File is required");
  }

  const prescriptionFile = await uploadToDigitalOcean(
    file,
    "prescription_file"
  );
  await prisma.prescription.create({
    data: {
      ...payload,
      doctorId,
      prescriptionFile,
    },
  });
  return;
};

const getPrescriptions = async (
  page: number,
  limit: number,
  patientId?: string,
  doctorId?: string,
  searchQuery?: string
) => {
  const additionalFilter: Prisma.PrescriptionWhereInput = {
    ...(patientId && { patientId }),
    ...(doctorId && { doctorId }),
  };

  const result = await searchAndPaginate<
    Prescription,
    Prisma.PrescriptionWhereInput,
    Prisma.PrescriptionSelect,
    Prisma.PrescriptionInclude,
    Prisma.PrescriptionOrderByWithRelationInput
  >({
    model: prisma.prescription,
    searchableFields: ["prescriptionName"],
    page,
    limit,
    searchQuery,
    additionalFilter,
    orderBy: { date: "desc" },
    selectFields: {
      id: true,
      prescriptionName: true,
      prescriptionFile: true,
      date: true,
      createdAt: true,
      patient: { select: { id: true, username: true, avatar: true } },
      doctor: {
        select: {
          id: true,
          username: true,
          avatar: true,
          uniqueId: true,
          doctor: {
            select: {
              BMDC_No: true,
              qualifications: true,
              designation: true,
            },
          },
        },
      },
    },
  });

  return result;
};

const getSinglePrescription = async (id: string) => {
  return await prisma.prescription.findUnique({
    where: { id },
    select: {
      id: true,
      prescriptionName: true,
      prescriptionFile: true,
      date: true,
      createdAt: true,
      doctor: {
        select: {
          id: true,
          username: true,
          avatar: true,
          uniqueId: true,
          doctor: {
            select: {
              BMDC_No: true,
              qualifications: true,
              designation: true,
            },
          },
        },
      },
    },
  });
};

const deletePrescription = async (id: string) => {
  await prisma.prescription.delete({ where: { id } });
  return;
};

export const prescriptionService = {
  createPrescription,
  deletePrescription,
  getPrescriptions,
  getSinglePrescription,
};
