import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { parcelService } from "./parcel.service";
import { UserRole } from "@prisma/client";

const createParcel = catchAsync(async (req: Request, res: Response) => {
  const parcelData = req.body;
  const customerId = req.user.id;

  const result = await parcelService.createParcel(parcelData, customerId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Parcel created successfully",
    data: result,
  });
});

const getAllParcels = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;
  const customerId = role === UserRole.CUSTOMER ? id : undefined;
  const agentId = role === UserRole.DELIVERY_AGENT ? id : undefined;

  const result = await parcelService.getAllParcels(
    req.query,
    customerId,
    agentId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Parcels retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleParcel = catchAsync(async (req: Request, res: Response) => {
  const parcelId = req.params.id;
  const result = await parcelService.getSingleParcel(parcelId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Parcel retrieved successfully",
    data: result,
  });
});

const updateParcelStatus = catchAsync(async (req: Request, res: Response) => {
  const { role, id } = req.user;
  const parcelId = req.params.id;
  const status = req.body.status;

  if (!status) throw new ApiError(400, "Status is required");

  const result = await parcelService.updateParcelStatus(
    parcelId,
    { status },
    role as UserRole,
    id
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Parcel status updated successfully",
    data: result,
  });
});

const deleteParcel = catchAsync(async (req: Request, res: Response) => {
  const parcelId = req.params.id;

  const result = await parcelService.deleteParcel(parcelId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Parcel deleted successfully",
    data: result,
  });
});

export const parcelController = {
  createParcel,
  getAllParcels,
  getSingleParcel,
  updateParcelStatus,
  deleteParcel,
};
