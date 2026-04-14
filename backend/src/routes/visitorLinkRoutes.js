import express from "express";
import VisitorLinkController from "../controllers/VisitorLinkController.js";

const router = express.Router();

router.get("/:token", VisitorLinkController.getByToken);

export default router;
