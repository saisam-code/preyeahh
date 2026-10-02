import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  idParamRule,
  searchRules,
  recommendRules,
  createResourceRules,
} from "../validators/resourceValidator.js";
import {
  searchResources,
  getResource,
  incrementViews,
  recommendResources,
  createResource,
  deleteResource,
} from "../controllers/resourceController.js";

const router = express.Router();

// Public — browse the library
router.get("/", searchRules, validate, searchResources);
router.get("/:id", idParamRule, validate, getResource);
router.patch("/:id/view", idParamRule, validate, incrementViews);

// Student
router.post("/recommend", protect, authorize("student"), recommendRules, validate, recommendResources);

// Admin or branch guide — curate the library
router.post("/", protect, authorize("admin", "guide"), createResourceRules, validate, createResource);
router.delete("/:id", protect, authorize("admin", "guide"), idParamRule, validate, deleteResource);

export default router;
