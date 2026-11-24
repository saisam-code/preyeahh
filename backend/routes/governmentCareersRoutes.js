import express from "express";
import {
  getGovernmentJobs,
  getGovernmentJobBySlug,
  getGovernmentExamsAndSyllabi,
  getGovernmentNotifications,
  compareGovernmentJobs,
  addGovernmentExamToPlanner,
} from "../controllers/governmentCareersController.js";
import { protect, authorize } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import { compareGovernmentJobsRules } from "../validators/aiRequestValidator.js";

const router = express.Router();

router.get("/jobs", getGovernmentJobs);
router.get("/jobs/:slug", getGovernmentJobBySlug);
router.get("/exams", getGovernmentExamsAndSyllabi);
router.get("/notifications", getGovernmentNotifications);
router.post("/compare", protect, aiLimiter, compareGovernmentJobsRules, validate, compareGovernmentJobs);
router.post("/add-to-planner", protect, authorize("student"), addGovernmentExamToPlanner);

export default router;
