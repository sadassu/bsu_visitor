import express from "express";
import VisitorLogController from "../controllers/VisitorLogController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", authMiddleware, VisitorLogController.getAll);
router.get(
  "/pending",
  authMiddleware,
  VisitorLogController.getPendingByUserOffice,
);
router.get("/counts", authMiddleware, VisitorLogController.countPerOffice);
router.get("/:id", authMiddleware, VisitorLogController.getById);
router.post(
  "/register",
  upload.single("img"),
  authMiddleware,
  VisitorLogController.register,
);
router.post("/", authMiddleware, VisitorLogController.create);
router.put("/:id", authMiddleware, VisitorLogController.update);
router.delete("/:id", authMiddleware, VisitorLogController.delete);

export default router;
