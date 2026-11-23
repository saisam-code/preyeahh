import express from "express";
import {
  getStudentProjects,
  addStudentProject,
  getPublicPortfolio,
  listOpportunities,
  listInstitutions,
  requestInstitutionAssociation,
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

// Institution
router.get("/institutions", listInstitutions);
router.get("/institution/status", protect, authorize("student"), getStudentInstitutionStatus);
router.post("/institution/associate", protect, authorize("student"), requestInstitutionAssociation);

export default router;
