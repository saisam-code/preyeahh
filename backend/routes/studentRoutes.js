import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerStudent,
  loginStudent,
  getMe,
  getInterestForRole,
  recordInterest,
  refreshToken,
  logoutStudent,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  extractProfile,
  updatePreferences,
  skipOnboarding,
  completeGoogleOnboarding,
} from "../controllers/studentController.js";
import {
  listRoleMentors,
  startConversation,
  listConversations,
  getConversation,
  sendMessage,
} from "../controllers/mentorshipController.js";

import { protect, authorize, protectGoogleOnboarding } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import {
  registerRules,
  loginRules,
  interestRules,
  roleIdParamRule,
  extractProfileRules,
  preferencesRules,
  googleOnboardingRules,
} from "../validators/studentValidator.js";
import {
  forgotPasswordRules,
  resetPasswordRules,
  resendVerificationRules,
} from "../validators/authValidator.js";
import {
  roleMentorsRules,
  startConversationRules,
  conversationIdRule,
  sendMentorshipMessageRules,
} from "../validators/mentorshipValidator.js";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many attempts, please try again later." },
});
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many attempts. Please try again in an hour." },
});
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many requests." },
});

router.post("/register", authLimiter, registerRules, validate, registerStudent);
router.post("/login", authLimiter, loginRules, validate, loginStudent);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutStudent);

router.post("/forgot-password", sensitiveLimiter, forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", sensitiveLimiter, resetPasswordRules, validate, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", sensitiveLimiter, resendVerificationRules, validate, resendVerification);

router.get("/me", protect, authorize("student"), getMe);
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

export default router;
