import { NextFunction, Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { notificationServices } from "./notification.service";
import { eventEmitter } from "../../utils/event_emitter";

const getNotificationsFrom = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id as string;
  const result = await notificationServices.getNotificationsFromDB(
    userId,
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification retrieved successfully",
    data: result,
  });
});

const getNotificationsCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write("event: connected\n");
    res.write(`data: Connected to notifications\n\n`);
    res.flushHeaders();
    const userId = req.user.id as string;
    const initialCount = await notificationServices.getNotificationsCount(
      userId
    );

    res.write("event: notificationCount\n");
    res.write(`data: ${JSON.stringify(initialCount)}\n\n`);

    const listener = async (receiverId: string) => {
      if (userId === receiverId) {
        const count = await notificationServices.getNotificationsCount(userId);
        res.write(`event: notificationCount\n`);
        res.write(`data: ${JSON.stringify(count)}\n\n`);
      }
    };

    eventEmitter.on(`notifications`, listener);

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

export const notificationController = {
  getNotificationsFrom,
  getNotificationsCount,
};
