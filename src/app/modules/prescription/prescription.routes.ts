import express from "express";
import { PrescriptionController } from "./prescription.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";
import auth from "../../middlewares/auth";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { PrescriptionValidation } from "./prescription.validation";

const router = express.Router();

router
  .post(
    "/",
    apiKeyMiddleware,
    auth(UserRole.DOCTOR),
    fileUploader.prescriptionFile,
    parseBodyData,
    validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
    PrescriptionController.createPrescription
  )
  .get("/", apiKeyMiddleware, auth(), PrescriptionController.getPrescriptions);

router
  .route("/:id")
  .get(apiKeyMiddleware, auth(), PrescriptionController.getSinglePrescription)
  .delete(
    apiKeyMiddleware,
    auth(UserRole.DOCTOR),
    PrescriptionController.deletePrescription
  );

export const prescriptionRoutes = router;
