import { Request, Response } from "express";
import { reportService } from "./report.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserRole } from "@prisma/client";

export const reportController = {
  createReport: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const diagnosticId = req.user.id;
    const files =
      (req.files as { [fieldname: string]: Express.Multer.File[] })?.[
        "reportFile"
      ] || [];
    const report = await reportService.createReport(
      payload,
      diagnosticId,
      files
    );

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Report created successfully",
      data: report,
    });
  }),

  updateReport: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const files = req.files as Express.Multer.File[];
    const report = await reportService.updateReport(id, payload, files);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Report updated successfully",
      data: report,
    });
  }),

  updateReportStatus: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const { id: doctorId } = req.user;
    const report = await reportService.updateStatus(id, doctorId, status);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Report status updated successfully",
      data: report,
    });
  }),

  getSingleReport: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await reportService.getSingleReport(id);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Report retrieved successfully",
      data: report,
    });
  }),

  getAllReports: catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const searchQuery = (req.query.searchQuery as string) || "";
    const { role, id } = req.user;
    const patientId = role === UserRole.PATIENT ? id : undefined;
    const doctorId = role === UserRole.DOCTOR ? id : undefined;
    const diagnosticId = role === UserRole.DIAGNOSTIC ? id : undefined;
    const reports = await reportService.getAllReports(
      page,
      limit,
      doctorId,
      diagnosticId,
      patientId,
      searchQuery
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Reports retrieved successfully",
      meta: reports.meta,
      data: reports.data,
    });
  }),
};
