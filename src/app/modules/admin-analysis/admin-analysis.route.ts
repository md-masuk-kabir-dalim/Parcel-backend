import { Router } from "express";
import { adminAnalysisController } from "./admin-analysis.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/summary",
  auth(UserRole.ADMIN),
  adminAnalysisController.getAdminSummary
);
router.get(
  "/monthly-revenue",
  auth(UserRole.ADMIN),
  adminAnalysisController.getMonthlyRevenue
);
router.get(
  "/top-customers",
  auth(UserRole.ADMIN),
  adminAnalysisController.getTopCustomers
);
router.get(
  "/top-agents",
  auth(UserRole.ADMIN),
  adminAnalysisController.getTopAgents
);

export const adminRoute = router;
