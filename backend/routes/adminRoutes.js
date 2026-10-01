import express from "express";
import rateLimit from "express-rate-limit";
import {
  loginAdmin,
  getMe,
  getDashboardStats,
  getRoleInterest,
  refreshToken,
  logoutAdmin,
  forgotPassword,
  resetPassword,
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { loginRules, interestQueryRules } from "../validators/adminValidator.js";
import { forgotPasswordRules, resetPasswordRules } from "../validators/authValidator.js";

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

router.post("/login", authLimiter, loginRules, validate, loginAdmin);
router.post("/refresh", refreshLimiter, refreshToken);
router.post("/logout", logoutAdmin);
router.post("/forgot-password", sensitiveLimiter, forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", sensitiveLimiter, resetPasswordRules, validate, resetPassword);

router.get("/me", protect, authorize("admin"), getMe);
router.get("/dashboard", protect, authorize("admin"), getDashboardStats);
router.get("/interest", protect, authorize("admin"), interestQueryRules, validate, getRoleInterest);

export default router;
