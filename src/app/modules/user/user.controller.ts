import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.service";
import { UserStatus } from "@prisma/client";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUserIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User created successfully",
    data: result,
  });
});

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  let bmdcFile: Express.Multer.File | undefined;
  let certificateFile: Express.Multer.File | undefined;
  let avatarFile: Express.Multer.File | undefined;

  if (req.files && typeof req.files === "object") {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    bmdcFile = files.bmdcFile?.[0];
    certificateFile = files.certificateFile?.[0];
    avatarFile = files.avatar?.[0];
  }

  if (!bmdcFile || !certificateFile || !avatarFile) {
    return res.status(400).json({
      success: false,
      message:
        "Please upload all required files: bmdcFile, certificateFile, and avatar.",
    });
  }

  const result = await userService.createDoctorIntoDB(
    req.body,
    bmdcFile,
    certificateFile,
    avatarFile
  );

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Doctor created successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  let { searchQuery, page = 1, limit = 10 } = req.query;
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const users = await userService.getUsersIntoDB(
    page,
    limit,
    searchQuery as string
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "users retrieved successfully",
    data: { mate: users.meta, users: users.userInfo.data },
  });
});

const getDoctorList = catchAsync(async (req: Request, res: Response) => {
  let { searchQuery, page = 1, limit = 10, status } = req.query;
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const users = await userService.getDoctorList(
    page,
    limit,
    status as UserStatus,
    searchQuery as string
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Doctor retrieved successfully",
    data: { mate: users.meta, doctorInfo: users.doctorInfo.data },
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getSingleUserIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrieved successfully",
    data: user,
  });
});

const getSingleDoctor = catchAsync(async (req: Request, res: Response) => {
  const doctor = await userService.getSingleDoctor(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Doctor retrieved successfully",
    data: doctor,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const updatedUser = await userService.updateUserIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user updated successfully",
    data: updatedUser,
  });
});

const deleteUser = catchAsync(async (req: any, res: Response) => {
  const userId = req.params.id;
  const loggedId = req.user.id;
  await userService.deleteUserIntoDB(userId, loggedId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user deleted successfully",
  });
});

const doctorStatusUpdate = catchAsync(async (req: any, res: Response) => {
  const userId = req.params.id;
  const { status } = req.body;
  await userService.doctorStatusUpdate(userId, status);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user status successfully",
  });
});

export const UserControllers = {
  createUser,
  createDoctor,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  getSingleDoctor,
  getDoctorList,
  doctorStatusUpdate,
};
