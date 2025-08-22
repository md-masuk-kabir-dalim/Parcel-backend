import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { prescriptionService } from "./prescription.service";
import ApiError from "../../../errors/ApiErrors";
import { UserRole } from "@prisma/client";

const createPrescription = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const file = req.file;
  const doctorId = req.user.id as string;

  if (!file) {
    throw new ApiError(400, "Prescription file is required");
  }

  const result = await prescriptionService.createPrescription(
    doctorId,
    payload,
    file
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Prescription created successfully",
    data: result,
  });
});

const getPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, searchQuery } = req.query;
  const { role, id } = req.user;
  const patientId = role === UserRole.PATIENT ? id : undefined;
  const doctorId = role === UserRole.DOCTOR ? id : undefined;
  const result = await prescriptionService.getPrescriptions(
    Number(page),
    Number(limit),
    patientId,
    doctorId,
    searchQuery as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Prescriptions retrieved",
    data: result,
  });
});

const getSinglePrescription = catchAsync(
  async (req: Request, res: Response) => {
    const result = await prescriptionService.getSinglePrescription(
      req.params.id
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Prescription retrieved",
      data: result,
    });
  }
);

const deletePrescription = catchAsync(async (req: Request, res: Response) => {
  await prescriptionService.deletePrescription(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Prescription deleted",
  });
});

export const PrescriptionController = {
  createPrescription,
  getPrescriptions,
  getSinglePrescription,
  deletePrescription,
};
