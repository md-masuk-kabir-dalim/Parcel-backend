import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";
import { parcelService } from "./parcel.service";
import { UserRole } from "@prisma/client";
import { eventEmitter } from "../../utils/event_emitter";
const clients: Response[] = [];

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

const getAllParcels = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userId, role } = req.user;
    const customerId = role === UserRole.CUSTOMER ? userId : undefined;
    const agentId = role === UserRole.DELIVERY_AGENT ? userId : undefined;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write("event: connected\n");
    res.write(`data: Connected to notifications\n\n`);
    res.flushHeaders();

    clients.push(res);

    const initialData = await parcelService.getAllParcels(
      req.query,
      customerId,
      agentId
    );
    res.write(`event: parcelList\n`);
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    const listener = async (receiverId: string) => {
      if (userId === receiverId) {
        const count = await parcelService.getAllParcels(
          req.query,
          customerId,
          agentId
        );
        res.write(`event: parcelList\n`);
        res.write(`data: ${JSON.stringify(count)}\n\n`);
      }
    };

    eventEmitter.on(`parcelList`, listener);

    const pingInterval = setInterval(() => {
      res.write("event: ping\n");
      res.write("data: keep-alive\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(pingInterval);
      eventEmitter.off("notifications", listener);
      res.end();
    });
  } catch (error) {
    next(error);
  }
};

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
