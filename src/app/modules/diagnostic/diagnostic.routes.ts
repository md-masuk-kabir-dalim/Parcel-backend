import express from "express";
import { diagnosticController } from "./diagnostic.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";
import auth from "../../middlewares/auth";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import { DiagnosticValidation } from "./diagnostic.validation";

const router = express.Router();

router
  .route("/")
  .post(
    apiKeyMiddleware,
    fileUploader.diagnosticLogo,
    parseBodyData,
    validateRequest(DiagnosticValidation.DiagnosticCreateSchema),
    diagnosticController.createDiagnostic
  )
  .get(apiKeyMiddleware, auth(), diagnosticController.getAllDiagnostic);

router.post(
  "/login",
  apiKeyMiddleware,
  validateRequest(DiagnosticValidation.DiagnosticLoginSchema),
  diagnosticController.diagnosticLogin
);

router
  .route("/:id")
  .patch(
    apiKeyMiddleware,
    auth(),
    fileUploader.diagnosticLogo,
    parseBodyData,
    diagnosticController.updateDiagnostic
  )
  .get(apiKeyMiddleware, auth(), diagnosticController.getSingleDiagnostic);

export const diagnosticRoute = router;
