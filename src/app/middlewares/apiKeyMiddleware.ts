import { Request, Response, NextFunction } from "express";
import ApiError from "../../errors/ApiErrors";
import httpStatus from "http-status";
import config from "../../config";

export const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "API key is required");
    }

    const isValidKey = apiKey === config.api_key;

    if (!isValidKey) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid or inactive API key"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};
