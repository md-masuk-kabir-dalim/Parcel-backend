import { Request, Response } from "express";
import { diagnosticService } from "./diagnostic.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

export const diagnosticController = {
  createDiagnostic: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const file = req.file as Express.Multer.File;

    const diagnostic = await diagnosticService.createDiagnostic(payload, file);

    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Diagnostic created successfully",
      data: diagnostic,
    });
  }),

  diagnosticLogin: catchAsync(async (req: Request, res: Response) => {
    const payload = req.body;
    const diagnostic = await diagnosticService.diagnosticLogin(payload);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Diagnostic login successfully",
      data: diagnostic,
    });
  }),

  updateDiagnostic: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;
    const file = req.file as Express.Multer.File;

    const diagnostic = await diagnosticService.updateDiagnostic(
      id,
      payload,
      file
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Diagnostic updated successfully",
      data: diagnostic,
    });
  }),

  getAllDiagnostic: catchAsync(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";

    const result = await diagnosticService.getAllDiagnostic(
      page,
      limit,
      search
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Diagnostics retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }),

  getSingleDiagnostic: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const diagnostic = await diagnosticService.getSingleDiagnostic(id);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Diagnostic retrieved successfully",
      data: diagnostic,
    });
  }),
};
