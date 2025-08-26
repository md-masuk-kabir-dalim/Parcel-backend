import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.service";
import { UserRole, UserStatus } from "@prisma/client";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUserIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User created successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req: Request, res: Response) => {
  let { searchQuery, page = 1, limit = 10, role } = req.query;
  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const users = await userService.getUsersIntoDB(
    page,
    limit,
    searchQuery as string,
    role as UserRole
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "users retrieved successfully",
    data: { mate: users.meta, users: users.userInfo.data },
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

export const UserControllers = {
  createUser,
  getUsers,
  getSingleUser,
  updateUser,
  deleteUser,
};
