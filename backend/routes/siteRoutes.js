import express from "express";

import {
  getSites,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
} from "../controllers/siteController.js";

const router = express.Router();

router.get("/", getSites);

router.get("/:id", getSiteById);

router.post("/", createSite);

router.put("/:id", updateSite);

router.delete("/:id", deleteSite);

export default router;