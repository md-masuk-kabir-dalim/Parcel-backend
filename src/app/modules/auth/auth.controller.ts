import { Request, Response } from "express";
import ApiError from "../../../errors/ApiErrors";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { authService } from "./auth.service";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginWithPassword(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users successfully logged in",
    data: result,
  });
});

const sendOtpCode = catchAsync(async (req: Request, res: Response) => {
  const { identify, otpType, deliveryType } = req.body;

  const response = await authService.sendOtpIntoDB(
    identify,
    otpType,
    deliveryType
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP has sent successfully",
    data: response,
  });
});

const verifyOtpCode = catchAsync(async (req: Request, res: Response) => {
  const { id, otpType } = req?.user;
  const { otpCode } = req.body;
  if (!otpCode) {
    throw new ApiError(400, "OTP are required.");
  }
  const response = await authService.verifyOtpCodeDB(id, otpCode, otpType);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified successfully.",
    data: response,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const { newPassword } = req.body;

  const result = await authService.resetPasswordIntoDB(id, newPassword);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getProfile = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const user = await authService.getProfileFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const updatedUser = await authService.updateProfileIntoDB(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile updated successfully",
    data: updatedUser,
  });
});

const updateProfileImage = catchAsync(async (req: any, res: Response) => {
  const { id } = req.user;
  const file = req.file as Express.Multer.File;

  const updatedUser = await authService.updateProfileImageIntoDB(id, file);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile image updated successfully",
    data: updatedUser,
  });
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  await authService.deleteAccount(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Account deleted successfully",
  });
});

export const authController = {
  loginUser,
  getProfile,
  updateProfile,
  sendOtpCode,
  verifyOtpCode,
  updateProfileImage,
  resetPassword,
  deleteAccount,
};
