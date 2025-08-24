import express from "express";
import { parcelController } from "./parcel.controller";
import { apiKeyMiddleware } from "../../middlewares/apiKeyMiddleware";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ParcelValidation } from "./parcel.validation";

const router = express.Router();

router
  .route("/")
  .post(
    apiKeyMiddleware,
    auth(UserRole.CUSTOMER),
    validateRequest(ParcelValidation.parcelSchema),
    parcelController.createParcel
  )
  .get(apiKeyMiddleware, auth(), parcelController.getAllParcels);

router
  .route("/:id")
  .get(apiKeyMiddleware, auth(), parcelController.getSingleParcel)
  .patch(
    apiKeyMiddleware,
    auth(UserRole.ADMIN, UserRole.DELIVERY_AGENT),
    parcelController.updateParcelStatus
  )
  .delete(
    apiKeyMiddleware,
    auth(UserRole.ADMIN, UserRole.CUSTOMER),
    parcelController.deleteParcel
  );

export const parcelRoutes = router;
