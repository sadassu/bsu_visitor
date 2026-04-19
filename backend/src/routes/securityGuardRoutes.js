import express from "express";
import SecurityGuardController from "../controllers/SecurityGuardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch(
  "/office/:id/status",
  authMiddleware,
  SecurityGuardController.updateOfficeStatus,
);

export default router;
