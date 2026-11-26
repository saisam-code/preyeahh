import express from "express";
import rateLimit from "express-rate-limit";
import {
  loginStudent,
  getMe,
  getInterestForRole,
  recordInterest,
  refreshToken,
  logoutStudent,
  getStudentGoals,
  changeStudentGoal,
  extractProfile,
  updatePreferences,
  skipOnboarding,
  completeGoogleOnboarding,
  getStudentParentLinks,
  updateStudentParentLinkStatus,
  associateWithInstitution,
} from "../controllers/studentController.js";
import { getBranches } from "../controllers/branchController.js";
import {
  listRoleMentors,
  startConversation,
  listConversations,
  getConversation,
  sendMessage,
} from "../controllers/mentorshipController.js";

import { protect, authorize, protectGoogleOnboarding } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { aiLimiter, authLimiter } from "../middleware/rateLimiters.js";
import {
  loginRules,
  interestRules,
  roleIdParamRule,
  extractProfileRules,
  preferencesRules,
  googleOnboardingRules,
  institutionAssociationRules,
  changeGoalRules,
} from "../validators/studentValidator.js";
import { listBranchesRules } from "../validators/branchValidator.js";
import {
  roleMentorsRules,
  startConversationRules,
  conversationIdRule,
  sendMentorshipMessageRules,
} from "../validators/mentorshipValidator.js";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many requests." },
});

router.post("/login", authLimiter, loginRules, validate, loginStudent);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutStudent);
router.get("/google-onboarding/branches", authLimiter, protectGoogleOnboarding, listBranchesRules, validate, getBranches);

router.get("/me", protect, authorize("student"), getMe);
router.get("/goals", protect, authorize("student"), getStudentGoals);
router.post("/goals", protect, authorize("student"), changeGoalRules, validate, changeStudentGoal);
router.get("/interest/:roleId", protect, authorize("student"), roleIdParamRule, validate, getInterestForRole);
router.post("/interest", protect, authorize("student"), interestRules, validate, recordInterest);

router.get("/mentorship/mentors", protect, authorize("student"), roleMentorsRules, validate, listRoleMentors);
router.get("/mentorship", protect, authorize("student"), listConversations);
router.post("/mentorship", protect, authorize("student"), startConversationRules, validate, startConversation);
router.get("/mentorship/:id", protect, authorize("student"), conversationIdRule, validate, getConversation);
router.post("/mentorship/:id/messages", protect, authorize("student"), sendMentorshipMessageRules, validate, sendMessage);

// AI learning profile (onboarding)
router.post("/profile/extract", protect, authorize("student"), aiLimiter, extractProfileRules, validate, extractProfile);
router.put("/profile/preferences", protect, authorize("student"), preferencesRules, validate, updatePreferences);
router.post("/profile/skip-onboarding", protect, authorize("student"), skipOnboarding);

// Google OAuth onboarding — accepts ONLY the short-lived onboarding token
router.post("/google-onboarding", protectGoogleOnboarding, googleOnboardingRules, validate, completeGoogleOnboarding);

// Parent links & Parental consent (Phase 1.3, 1.12)
router.get("/parent-links", protect, authorize("student"), getStudentParentLinks);
router.put("/parent-links/:id/status", protect, authorize("student"), updateStudentParentLinkStatus);

// Institution Association (Phase 1.4)
router.post(
  "/institution-associate",
  protect,
  authorize("student"),
  institutionAssociationRules,
  validate,
  associateWithInstitution
);

export default router;
