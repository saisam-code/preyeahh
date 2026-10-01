import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerGuide,
  loginGuide,
  getMe,
  listGuides,
  setGuideStatus,
  assignGuideRoles,
  deleteGuide,
  refreshToken,
  logoutGuide,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/guideController.js";

import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  registerRules,
  loginRules,
  idParamRule,
  setStatusRules,
  assignRolesRules,
} from "../validators/guideValidator.js";
import {
  forgotPasswordRules,
  resetPasswordRules,
  resendVerificationRules,
} from "../validators/authValidator.js";

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

router.post("/register", authLimiter, registerRules, validate, registerGuide);
router.post("/login", authLimiter, loginRules, validate, loginGuide);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutGuide);

router.post("/forgot-password", sensitiveLimiter, forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", sensitiveLimiter, resetPasswordRules, validate, resetPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", sensitiveLimiter, resendVerificationRules, validate, resendVerification);

router.get("/me", protect, authorize("guide"), getMe);

router.get("/", protect, authorize("admin"), listGuides);
router.put("/:id/status", protect, authorize("admin"), setStatusRules, validate, setGuideStatus);
router.put("/:id/roles", protect, authorize("admin"), assignRolesRules, validate, assignGuideRoles);
router.delete("/:id", protect, authorize("admin"), idParamRule, validate, deleteGuide);

export default router;
