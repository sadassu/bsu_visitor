import express from "express";
import VisitorStatusController from "../controllers/VisitorStatusController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch(
  "/:id/status",
  authMiddleware,
  VisitorStatusController.updateStatus,
);

router.patch(
  "/office/:officeId/status",
  authMiddleware,
  VisitorStatusController.updateStatusByOffice,
);

router.get(
  "/status/:status",
  authMiddleware,
  VisitorStatusController.findByStatus,
);

router.get(
  "/office/:officeId/status-count",
  authMiddleware,
  VisitorStatusController.countByOffice,
);

export default router;
