import { Prisma, Report, ReportStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import searchAndPaginate from "../../../helpers/searchAndPaginate";
import { reportInput } from "./report.validation";
import ApiError from "../../../errors/ApiErrors";
import uploadToDigitalOcean from "../../../helpers/uploadToDigitalOcean";

const createReport = async (
  payload: reportInput,
  diagnosticId: string,
  files: Express.Multer.File[]
) => {
  if (!files || files.length === 0) {
    throw new ApiError(400, "Report file is required");
  }
  const uploadedFileUrls = await Promise.all(
    files.map((file) => uploadToDigitalOcean(file, "report"))
  );

  await prisma.report.create({
    data: {
      ...payload,
      diagnosticId,
      reportFile: uploadedFileUrls,
    },
  });

  return;
};

const updateReport = async (
  id: string,
  payload: Partial<Report>,
  files?: Express.Multer.File[]
) => {
  let uploadedFileUrls: string[] | undefined;

  if (files && files.length > 0) {
    uploadedFileUrls = await Promise.all(
      files.map((file) => uploadToDigitalOcean(file, "report"))
    );
  }

  const updatedReport = await prisma.report.update({
    where: { id },
    data: {
      ...payload,
      ...(uploadedFileUrls ? { reportFile: uploadedFileUrls } : {}),
    },
  });

  return updatedReport;
};

const getSingleReport = async (id: string) => {
  const report = await prisma.report.findUnique({
    where: {
      id,
    },
    include: {
      diagnostic: {
        select: {
          id: true,
          avatar: true,
          uniqueId: true,
          address: true,
        },
      },
      doctor: {
        select: {
          id: true,
          username: true,
          avatar: true,
          uniqueId: true,
          doctor: {
            select: {
              id: true,
              averageRating: true,
              BMDC_No: true,
              qualifications: true,
              day: true,
              endTime: true,
              startTime: true,
              designation: true,
            },
          },
        },
      },
    },
  });
  return report;
};

const updateStatus = async (
  reportId: string,
  doctorId: string,
  status: ReportStatus
) => {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { status: true, doctorId: true },
  });

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  if (report.doctorId !== doctorId) {
    throw new ApiError(403, "You are not authorized to update this report");
  }

  if (
    report.status === ReportStatus.COMPLETED ||
    report.status === ReportStatus.CANCELLED
  ) {
    throw new ApiError(
      400,
      `Cannot update status. Report is already ${report.status}`
    );
  }

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: { status },
  });

  return updated;
};

const getAllReports = async (
  page: number,
  limit: number,
  doctorId?: string,
  diagnosticId?: string,
  patientId?: string,
  searchQuery?: string
) => {
  const additionalFilter: Prisma.ReportWhereInput = {
    ...(doctorId && { doctorId }),
    ...(patientId && { patientId, status: ReportStatus.COMPLETED }),
    ...(diagnosticId && { diagnosticId }),
  };

  const result = await searchAndPaginate<
    Report,
    Prisma.ReportWhereInput,
    Prisma.ReportSelect,
    Prisma.ReportInclude,
    Prisma.ReportOrderByWithRelationInput
  >({
    model: prisma.report,
    searchableFields: ["status"],
    page,
    limit,
    searchQuery,
    additionalFilter,
    selectFields: {
      id: true,
      amount: true,
      status: true,
      testReport: true,
      createdAt: true,
      diagnostic: {
        select: {
          id: true,
          avatar: true,
          uniqueId: true,
          email: true,
          address: true,
        },
      },
      doctor: {
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          uniqueId: true,
          doctor: {
            select: {
              id: true,
              averageRating: true,
              BMDC_No: true,
              qualifications: true,
              day: true,
              endTime: true,
              startTime: true,
              designation: true,
            },
          },
        },
      },
    },
  });

  return result;
};

export const reportService = {
  createReport,
  updateReport,
  getSingleReport,
  getAllReports,
  updateStatus,
};
