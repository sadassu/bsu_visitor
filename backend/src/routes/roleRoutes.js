import express from "express";
import { getRoles } from "../controllers/RoleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getRoles);

export default router;