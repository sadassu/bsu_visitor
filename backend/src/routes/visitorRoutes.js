import express from "express";
import VisitorController from "../controllers/VisitorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/",
  upload.single("img"),
  authMiddleware,
  VisitorController.create,
);
router.get("/", authMiddleware, VisitorController.getAll);
router.get("/:id", authMiddleware, VisitorController.getById);
router.put("/:id", authMiddleware, VisitorController.update);
router.delete("/:id", authMiddleware, VisitorController.delete);

export default router;
