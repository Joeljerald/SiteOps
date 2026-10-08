import express from "express";
import {
  getInstallations,
  getInstallationById,
  createInstallation,
  updateInstallation,
  deleteInstallation,
} from "../controllers/installationController.js";

const router = express.Router();

router.get("/", getInstallations);
router.get("/:id", getInstallationById);
router.post("/", createInstallation);
router.put("/:id", updateInstallation);
router.delete("/:id", deleteInstallation);

export default router;
