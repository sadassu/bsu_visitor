import express from "express";
import VisitorController from "../controllers/VisitorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, VisitorController.getAll);
router.get("/:id", authMiddleware, VisitorController.getById);
router.post("/", authMiddleware, VisitorController.create);
router.put("/:id", authMiddleware, VisitorController.update);
router.delete("/:id", authMiddleware, VisitorController.delete);

export default router;
