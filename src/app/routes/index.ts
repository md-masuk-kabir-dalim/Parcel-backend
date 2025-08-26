import express from "express";
import { authRoute } from "../modules/auth/auth.routes";
import { chatRoute } from "../modules/chat/chat.routes";
import { notificationRoute } from "../modules/notifications/notification.routes";
import { userRoutes } from "../modules/user/user.route";
import { parcelRoutes } from "../modules/parcel/parcel.routes";
import { adminRoute } from "../modules/admin-analysis/admin-analysis.route";

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
    path: "/chat",
    route: chatRoute,
  },
  {
    path: "/parcel",
    route: parcelRoutes,
  },
  {
    path: "/admin",
    route: adminRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
