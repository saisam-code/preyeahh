/**
 * SOURCE: Merged from preyeahouter/backend/services/auth.service.js (App A)
 *         + preyeah-main/server/models/auth.js (App B patterns)
 *
 * UNIFIED AUTH SERVICE:
 *   - Single User model (both App A fields + App B fields)
 *   - Email verification (new; from App B)
 *   - Password reset flow (new; from App B)
 *   - Google OAuth ready (App A pattern; routes TBD)
 *   - Refresh token versioning (App B security pattern)
 */

import User from "../models/User.js";
import { signAccessToken, signRefreshToken, refreshCookieOptions } from "./token.service.js";
import { ApiError } from "../utils/ApiError.js";
import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL CONFIG (placeholder; configure in .env)
// ─────────────────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────

export const register = async (email, password, firstName = "", lastName = "") => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Create new user
  const user = await User.create({
    email: email.toLowerCase(),
    password, // Will be hashed by pre('save') hook
    firstName,
    lastName,
    role: "student", // Default role
  });

  // Generate email verification token
  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;

  try {
    await transporter.sendMail({
      to: user.email,
      subject: "Verify your Pre-Yeah account",
      html: `
        <p>Hi ${firstName || user.email},</p>
        <p>Click the link below to verify your email:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send verification email:", err.message);
    // Don't throw — user is still created, they can request resend
  }

  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isVerified: user.isVerified,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  // Find user + select password field for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    branch: user.branch,
    isVerified: user.isVerified,
    preferences: user.preferences,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL TOKEN
// ─────────────────────────────────────────────────────────────────────────────

export const verifyEmail = async (rawToken) => {
  // Hash the raw token to find the user
  const crypto = await import("crypto");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification token");
  }

  user.isVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  return {
    id: user._id,
    email: user.email,
    isVerified: user.isVerified,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD (initiate reset)
// ─────────────────────────────────────────────────────────────────────────────

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // For security, don't reveal if email exists
    return { message: "If email exists, reset link sent" };
  }

  // Generate password reset token
  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send reset email
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

  try {
    await transporter.sendMail({
      to: user.email,
      subject: "Reset your Pre-Yeah password",
      html: `
        <p>Hi ${user.firstName || user.email},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 15 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send reset email:", err.message);
    throw new ApiError(500, "Failed to send reset email");
  }

  return { message: "Password reset link sent to email" };
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

export const resetPassword = async (rawToken, newPassword) => {
  const crypto = await import("crypto");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = newPassword; // Will be hashed by pre('save') hook
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.refreshTokenVersion += 1; // Invalidate all old refresh tokens
  await user.save();

  return {
    id: user._id,
    email: user.email,
    message: "Password reset successful. Please log in again.",
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────────────────────────────────────────

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.pp_rt;

  if (!refreshToken) {
    throw new ApiError(401, "No refresh token");
  }

  // Verify refresh token using JWT_REFRESH_SECRET
  const { verifyRefreshToken } = await import("./token.service.js");
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Fetch user + check if version matches
  const user = await User.findById(decoded.id);
  if (!user || user.refreshTokenVersion !== decoded.version) {
    throw new ApiError(401, "Refresh token invalidated");
  }

  // Issue new access token + rotate refresh token
  const { issueTokens } = await import("./token.service.js");
  const accessToken = issueTokens(res, user, user.role);

  return {
    accessToken,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      branch: user.branch,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export const logout = async (userId) => {
  // Increment refreshTokenVersion to invalidate all refresh tokens
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { refreshTokenVersion: 1 } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return { message: "Logged out successfully" };
};
