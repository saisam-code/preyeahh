import express from "express";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  idParamRule,
  searchRules,
  recommendRules,
  createResourceRules,
  updateResourceRules,
} from "../validators/resourceValidator.js";
import {
  searchResources,
  getResourceCoverage,
  getResource,
  incrementViews,
  recommendResources,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/resourceController.js";

const router = express.Router();

// Public — browse the library
router.get("/", optionalAuth, searchRules, validate, searchResources);
router.get("/coverage", protect, authorize("admin"), getResourceCoverage);
router.get("/:id", optionalAuth, idParamRule, validate, getResource);
router.patch("/:id/view", idParamRule, validate, incrementViews);
router.patch("/:id", protect, authorize("admin", "guide"), updateResourceRules, validate, updateResource);

// Student
router.post("/recommend", protect, authorize("student"), recommendRules, validate, recommendResources);

// Admin or branch guide — curate the library
router.post("/", protect, authorize("admin", "guide"), createResourceRules, validate, createResource);
router.delete("/:id", protect, authorize("admin", "guide"), idParamRule, validate, deleteResource);

export default router;
