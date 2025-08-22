import express from "express";
import { authRoute } from "../modules/auth/auth.routes";
import { chatRoute } from "../modules/chat/chat.routes";
import { notificationRoute } from "../modules/notifications/notification.routes";
import { userRoutes } from "../modules/user/user.route";
import { diagnosticRoute } from "../modules/diagnostic/diagnostic.routes";
import { bookingRoutes } from "../modules/bookings/bookings.routes";
import { reportRoute } from "../modules/report/report.route";
import { prescriptionRoutes } from "../modules/prescription/prescription.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },

  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/notifications",
    route: notificationRoute,
  },
  {
    path: "/diagnostic",
    route: diagnosticRoute,
  },
  {
    path: "/chat",
    route: chatRoute,
  },
  {
    path: "/bookings",
    route: bookingRoutes,
  },
  {
    path: "/reports",
    route: reportRoute,
  },
  {
    path: "/prescriptions",
    route: prescriptionRoutes,
  },
  {
    path: "/payment",
    route: paymentRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
