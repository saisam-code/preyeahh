/**
 * Google OAuth routes.
 *
 *   GET /api/auth/google          — redirect to Google
 *   GET /api/auth/google/callback — receive code, issue tokens, redirect to frontend
 */

import express from "express";
import rateLimit from "express-rate-limit";
import { initiateGoogleAuth, handleGoogleCallback } from "../controllers/googleAuthController.js";

const router = express.Router();

// Limit to 20 initiation attempts per 15 minutes per IP
const googleInitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: "Too many Google login attempts." },
});

router.get("/google", googleInitLimiter, initiateGoogleAuth);
router.get("/google/callback", handleGoogleCallback);

export default router;
