/**
 * SOURCE: Merged from preyeahouter/backend/controllers/auth.controller.js (App A)
 *         + preyeah-main/server/controllers/auth flows (App B)
 *
 * UNIFIED AUTH CONTROLLER:
 *   - POST /auth/register — create account, send verification email
 *   - POST /auth/login — verify credentials, issue tokens
 *   - POST /auth/verify-email — verify email token
 *   - POST /auth/forgot-password — initiate password reset
 *   - POST /auth/reset-password — reset password with token
 *   - POST /auth/refresh — rotate access token
 *   - POST /auth/logout — revoke refresh tokens
 *   - GET /auth/me — fetch current user profile
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import * as authService from "../services/auth.service.js";
import { clearRefreshCookie } from "../services/token.service.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await authService.register(email, password, firstName, lastName);

  res.status(201).json(
    new ApiResponse(201, user, "Account created. Check email for verification link.")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await authService.login(email, password);

  // Issue tokens (access + refresh cookie)
  const { issueTokens } = await import("../services/token.service.js");
  const dbUser = await User.findById(user.id);
  const accessToken = issueTokens(res, dbUser, user.role);

  res.json(
    new ApiResponse(200, { accessToken, user }, "Login successful")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const result = await authService.verifyEmail(token);

  res.json(
    new ApiResponse(200, result, "Email verified successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const result = await authService.forgotPassword(email);

  res.json(
    new ApiResponse(200, result, result.message)
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, "Token and new password are required");
  }

  const result = await authService.resetPassword(token, password);

  res.json(
    new ApiResponse(200, result, "Password reset successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────────────────────────────────────────
export const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshAccessToken(req, res);

  res.json(
    new ApiResponse(200, result, "Token refreshed")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user.id);

  // Clear refresh cookie
  clearRefreshCookie(res);

  res.json(
    new ApiResponse(200, result, "Logged out successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.json(
    new ApiResponse(200, user.toSafeJSON(), "User profile retrieved")
  );
});
