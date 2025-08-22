import { Router } from "express";
import auth from "../../middlewares/auth";
import { notificationController } from "./notification.controller";

const router = Router();

router.get("/", auth(), notificationController.getNotificationsFrom);
export const notificationRoute = router;
