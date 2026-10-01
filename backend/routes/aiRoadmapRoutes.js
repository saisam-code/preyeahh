import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import { idParamRule, listRules, generateRules, progressRules } from "../validators/aiRoadmapValidator.js";
import {
  generateRoadmap,
  listRoadmaps,
  getRoadmap,
  updateTopicProgress,
  deleteRoadmap,
} from "../controllers/aiRoadmapController.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.post("/generate", aiLimiter, generateRules, validate, generateRoadmap);
router.get("/", listRules, validate, listRoadmaps);
router.get("/:id", idParamRule, validate, getRoadmap);
router.patch("/:id/progress", progressRules, validate, updateTopicProgress);
router.delete("/:id", idParamRule, validate, deleteRoadmap);

export default router;
