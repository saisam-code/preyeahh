import express from "express";
import rateLimit from "express-rate-limit";
import {
  loginGuide,
  completeGoogleGuideOnboarding,
  getMe,
  getGuideBranchOverview,
  listGuides,
  setGuideStatus,
  assignGuideRoles,
  deleteGuide,
  refreshToken,
  logoutGuide,
} from "../controllers/guideController.js";
import {
  listConversations,
  getConversation,
  sendMessage,
} from "../controllers/mentorshipController.js";

import { protect, authorize, protectGoogleOnboarding } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  googleGuideOnboardingRules,
  loginRules,
  idParamRule,
  setStatusRules,
  assignRolesRules,
} from "../validators/guideValidator.js";
import { conversationIdRule, sendMentorshipMessageRules } from "../validators/mentorshipValidator.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many requests." },
});

router.post("/login", authLimiter, loginRules, validate, loginGuide);
router.post("/google-onboarding", authLimiter, protectGoogleOnboarding, googleGuideOnboardingRules, validate, completeGoogleGuideOnboarding);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutGuide);

router.get("/me", protect, authorize("guide"), getMe);
router.get("/me/branch-overview", protect, authorize("guide"), getGuideBranchOverview);
router.get("/me/conversations", protect, authorize("guide"), listConversations);
router.get("/me/conversations/:id", protect, authorize("guide"), conversationIdRule, validate, getConversation);
router.post("/me/conversations/:id/messages", protect, authorize("guide"), sendMentorshipMessageRules, validate, sendMessage);

router.get("/", protect, authorize("admin"), listGuides);
router.put("/:id/status", protect, authorize("admin"), setStatusRules, validate, setGuideStatus);
router.put("/:id/roles", protect, authorize("admin"), assignRolesRules, validate, assignGuideRoles);
router.delete("/:id", protect, authorize("admin"), idParamRule, validate, deleteGuide);

export default router;
