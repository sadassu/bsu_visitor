import express from "express";
import OfficeController from "../controllers/OfficeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, OfficeController.getAll);
router.get("/staff/dashboard", authMiddleware, OfficeController.getStaffOfficeDashboard);
router.patch("/:id/status", authMiddleware, OfficeController.updateStatus);

export default router;
