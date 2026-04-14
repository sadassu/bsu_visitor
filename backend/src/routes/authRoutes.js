import express from "express";
import UserController from "../controllers/UserController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/login", UserController.login);
router.post("/logout", UserController.logout);

// Protected routes
router.get("/me", authMiddleware, UserController.getCurrentUser);
router.get("/all-with-activity", authMiddleware, UserController.getAllWithLastActivity);
router.get("/", authMiddleware, UserController.getAll);
router.get("/:id", authMiddleware, UserController.getById);
router.post("/", authMiddleware, UserController.create);
router.put("/:id", authMiddleware, UserController.update);
router.delete("/:id", authMiddleware, UserController.delete);

export default router;
