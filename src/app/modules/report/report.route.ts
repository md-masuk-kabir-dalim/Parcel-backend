import express from "express";
import { reportController } from "./report.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReportValidation } from "./report.validation";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";

const router = express.Router();

router
  .route("/")
  .post(
    auth(UserRole.DIAGNOSTIC),
    fileUploader.reportImages,
    parseBodyData,
    validateRequest(ReportValidation.ReportCreateSchema),
    reportController.createReport
  )
  .get(auth(), reportController.getAllReports);

router.patch(
  "/report-status/:id",
  apiKeyMiddleware,
  auth(UserRole.DOCTOR),
  reportController.updateReportStatus
);

router
  .route("/:id")
  .patch(
    auth(UserRole.DIAGNOSTIC),
    parseBodyData,
    reportController.updateReport
  )
  .get(auth(), reportController.getSingleReport);

export const reportRoute = router;
