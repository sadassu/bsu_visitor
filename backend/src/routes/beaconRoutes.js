import express from "express";
import BeaconController from "../controllers/beaconController.js";

const router = express.Router();

router.post("/", BeaconController.create);
router.get("/", BeaconController.getAll);
router.get("/by-identity", BeaconController.getByIdentity);
router.get("/:id", BeaconController.getById);
router.put("/:id", BeaconController.update);
router.delete("/:id", BeaconController.delete);

export default router;
