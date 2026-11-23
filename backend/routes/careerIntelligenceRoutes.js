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
import { protect, authorize, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/roles", discoverCareers);
router.get("/roles/:id/reality", getCareerReality);
router.post("/compare", optionalAuth, compareCareers);
router.post("/switch-analysis", optionalAuth, analyzeCareerSwitch);

// Experiments (student-facing)
router.get("/experiments", protect, authorize("student"), getStudentExperiments);
router.post("/experiments", protect, authorize("student"), startExperiment);
router.patch("/experiments/:id/complete", protect, authorize("student"), completeExperiment);

export default router;
