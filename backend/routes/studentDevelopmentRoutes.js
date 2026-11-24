import express from "express";
import {
  getStudentProjects,
  addStudentProject,
  getPublicPortfolio,
  listOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  listInstitutions,
  getStudentInstitutionStatus,
} from "../controllers/studentDevelopmentController.js";
import { protect, authorize, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Portfolio & Projects
router.get("/projects", protect, authorize("student"), getStudentProjects);
router.post("/projects", protect, authorize("student"), addStudentProject);
router.get("/portfolio/:studentId", getPublicPortfolio);

// Opportunities
router.get("/opportunities", listOpportunities);
router.post("/opportunities", protect, authorize("admin", "guide"), createOpportunity);
router.put("/opportunities/:id", protect, authorize("admin", "guide"), updateOpportunity);
router.delete("/opportunities/:id", protect, authorize("admin"), deleteOpportunity);

// Institution
router.get("/institutions", listInstitutions);
router.get("/institution/status", protect, authorize("student"), getStudentInstitutionStatus);

export default router;
