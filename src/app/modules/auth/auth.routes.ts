import express from "express";
import { fileUploader } from "../../../helpers/fileUploader";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import validateOtpMiddleware from "../../middlewares/verify.otp.token";
import { authController } from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/login",
  apiKeyMiddleware,
  validateRequest(authValidation.authLoginSchema),
  authController.loginUser
);

router.post(
  "/otp/send",
  apiKeyMiddleware,
  validateRequest(authValidation.sendOtpSchema),
  authController.sendOtpCode
);

router.post(
  "/otp/verify",
  apiKeyMiddleware,
  validateOtpMiddleware(),
  authController.verifyOtpCode
);

router.patch(
  "/password/reset",
  apiKeyMiddleware,
  validateOtpMiddleware(),
  authController.resetPassword
);

router.patch(
  "/me/avatar",
  apiKeyMiddleware,
  auth(),
  fileUploader.profileImage,
  authController.updateProfileImage
);

router
  .route("/me")
  .get(apiKeyMiddleware, auth(), authController.getProfile)
  .patch(apiKeyMiddleware, auth(), authController.updateProfile)
  .delete(apiKeyMiddleware, auth(), authController.deleteAccount);

export const authRoute = router;
