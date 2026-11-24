import express from "express";
import {
  discoverCareers,
  getCareerReality,
  compareCareers,
  analyzeCareerSwitch,
  startExperiment,
  getStudentExperiments,
  completeExperiment,
} from "../controllers/careerIntelligenceController.js";
import {
  calculateFinancialRoi,
  recordCareerOutcome,
  getPublicOutcomes,
  submitInformationForVerification,
  submitReport,
  blockUser,
} from "../controllers/advancedCapabilitiesController.js";
import { protect, authorize } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import {
  analyzeCareerSwitchRules,
  calculateFinancialRoiRules,
  compareCareersRules,
} from "../validators/aiRequestValidator.js";

const router = express.Router();

router.get("/roles", discoverCareers);
router.get("/roles/:id/reality", getCareerReality);
router.post("/compare", protect, aiLimiter, compareCareersRules, validate, compareCareers);
router.post("/switch-analysis", protect, aiLimiter, analyzeCareerSwitchRules, validate, analyzeCareerSwitch);
router.post("/financial-roi", protect, aiLimiter, calculateFinancialRoiRules, validate, calculateFinancialRoi);

// Public verified outcomes
router.get("/outcomes", getPublicOutcomes);
router.post("/outcomes", protect, authorize("student"), recordCareerOutcome);

// Experiments (student-facing)
router.get("/experiments", protect, authorize("student"), getStudentExperiments);
router.post("/experiments", protect, authorize("student"), startExperiment);
router.patch("/experiments/:id/complete", protect, authorize("student"), completeExperiment);

// Trust, Safety & Verification
router.post("/verify-submission", protect, authorize("guide", "admin"), submitInformationForVerification);
router.post("/report", protect, submitReport);
router.post("/block", protect, blockUser);

export default router;
