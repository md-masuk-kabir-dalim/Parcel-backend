import { UserRole } from "@prisma/client";
import express from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { userValidation } from "./user.validation";

const router = express.Router();

router
  .route("/")
  .post(
    apiKeyMiddleware,
    fileUploader.profileImage,
    validateRequest(userValidation.userRegisterValidationSchema),
    UserControllers.createUser
  )
  .get(apiKeyMiddleware, auth(), UserControllers.getUsers);

router
  .route("/:id")
  .get(auth(UserRole.ADMIN), UserControllers.getSingleUser)
  .patch(auth(UserRole.ADMIN), UserControllers.updateUser)
  .delete(auth(UserRole.ADMIN), UserControllers.deleteUser);

export const userRoutes = router;
