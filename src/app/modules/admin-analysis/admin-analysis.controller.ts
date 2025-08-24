import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { adminAnalysisService } from "./admin-analysis.service";
import sendResponse from "../../../shared/sendResponse";

const getAdminSummary = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAnalysisService.adminSummary();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin summary fetched successfully",
    data,
  });
});

const getMonthlyRevenue = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAnalysisService.monthlyRevenue();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Monthly revenue chart fetched successfully",
    data,
  });
});

const getTopCustomers = catchAsync(async (req: Request, res: Response) => {
  const data = await adminAnalysisService.topCustomerList();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Top customers fetched successfully",
    data,
  });
});

const getTopAgents = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 5;
  const data = await adminAnalysisService.topAgents(limit);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Top delivery agents fetched successfully",
    data,
  });
});

export const adminAnalysisController = {
  getAdminSummary,
  getMonthlyRevenue,
  getTopCustomers,
  getTopAgents,
};
