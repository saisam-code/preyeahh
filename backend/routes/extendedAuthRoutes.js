import express from "express";
import {
  registerParent,
  loginParent,
  refreshParent,
  getParentWards,
  getParentWardDetail,
  requestParentLink,
  registerInstitution,
  loginInstitution,
  refreshInstitution,
  getInstitutionMembers,
  approveInstitutionMember,
  removeInstitutionMember,
  rotateInstitutionCode,
  getExtendedMe,
  logoutExtended,
} from "../controllers/extendedAuthController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import {
  extendedLoginRules,
  institutionRefreshRules,
  institutionRegisterRules,
  parentRefreshRules,
  parentRegisterRules,
} from "../validators/extendedAuthValidator.js";

const router = express.Router();

// ── PARENT AUTH & LINKING ──
router.post("/parent/register", authLimiter, parentRegisterRules, validate, registerParent);
router.post("/parent/login", authLimiter, extendedLoginRules, validate, loginParent);
router.post("/parent/refresh", authLimiter, parentRefreshRules, validate, refreshParent);
router.get("/parent/me", protect, authorize("parent"), getExtendedMe);
router.get("/parent/wards", protect, authorize("parent"), getParentWards);
router.get("/parent/wards/:studentId", protect, authorize("parent"), getParentWardDetail);
router.post("/parent/links/request", protect, authorize("parent"), requestParentLink);
router.post("/parent/logout", protect, authorize("parent"), logoutExtended);

// ── INSTITUTION AUTH & COHORT MANAGEMENT ──
router.post("/institution/register", authLimiter, institutionRegisterRules, validate, registerInstitution);
router.post("/institution/login", authLimiter, extendedLoginRules, validate, loginInstitution);
router.post("/institution/refresh", authLimiter, institutionRefreshRules, validate, refreshInstitution);
router.get("/institution/me", protect, authorize("institution"), getExtendedMe);
router.get("/institution/members", protect, authorize("institution"), getInstitutionMembers);
router.put("/institution/members/:id/approve", protect, authorize("institution"), approveInstitutionMember);
router.put("/institution/members/:id/remove", protect, authorize("institution"), removeInstitutionMember);
router.post("/institution/rotate-code", protect, authorize("institution"), rotateInstitutionCode);
router.post("/institution/logout", protect, authorize("institution"), logoutExtended);

export default router;
