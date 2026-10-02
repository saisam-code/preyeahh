import crypto from "crypto";
import Student from "../models/Student.js";
import Role from "../models/Role.js";
import RoleInterest from "../models/RoleInterest.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import sendEmail, { assertEmailConfigured, getClientUrl } from "../utils/sendEmail.js";
import { verifyRefreshToken, issueTokens, clearRefreshCookie } from "../services/tokenService.js";
import * as profileService from "../services/profileService.js";

export const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, password, branch } = req.body;

  const existing = await Student.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict("An account with this email already exists. Try logging in instead.");
  assertEmailConfigured();

  const student = await Student.create({ name, email, password, branch });

  const rawToken = student.createEmailVerificationToken();
  await student.save({ validateBeforeSave: false });

  const verifyUrl = `${getClientUrl()}/verify-email/${rawToken}?role=student`;
  if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
    logger.dev(`[DEV] Student verification link for ${student.email}: ${verifyUrl}`);
  }

  await sendEmail({
    to: student.email,
    subject: "Verify your Preyeahh account",
    html: `<p>Hi ${student.name},</p><p>Welcome to Preyeahh. Verify your email to activate your account:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
  });

  res.status(201).json(
    new ApiResponse(201, { email: student.email }, "Registration successful. Check your email to verify your account before logging in.")
  );
});

export const loginStudent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const student = await Student.findOne({ email: email.toLowerCase() }).select("+password");
  if (!student || !(await student.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!student.isVerified) {
    throw ApiError.forbidden("Please verify your email before logging in. Check your inbox for the verification link.");
  }

  const accessToken = issueTokens(res, student, "student");
  res.status(200).json(new ApiResponse(200, { accessToken, user: student.toSafeJSON() }, "Login successful"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt_student;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
  if (decoded.role !== "student") throw ApiError.unauthorized("Invalid refresh token");

  const student = await Student.findById(decoded.id).select("+refreshTokenVersion");
  if (!student) throw ApiError.unauthorized("Account no longer exists");
  if ((student.refreshTokenVersion || 0) !== decoded.version) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  const accessToken = issueTokens(res, student, "student");
  res.status(200).json(new ApiResponse(200, { accessToken, user: student.toSafeJSON() }, "Token refreshed"));
});

export const logoutStudent = asyncHandler(async (req, res) => {
  clearRefreshCookie(res, "student");
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.doc.toSafeJSON(), "Profile fetched"));
});

export const getInterestForRole = asyncHandler(async (req, res) => {
  const interest = await RoleInterest.findOne({ student: req.user.id, role: req.params.roleId });
  res.status(200).json(new ApiResponse(200, interest ? { committed: interest.committed } : null, "Interest checked"));
});

export const recordInterest = asyncHandler(async (req, res) => {
  const { roleId, committed } = req.body;
  const role = await Role.findById(roleId);
  if (!role) throw ApiError.notFound("Role not found");
  if (role.branch !== req.user.branch) {
    throw ApiError.forbidden(`${role.title} is a ${role.branch} role — only ${req.user.branch} roles count toward your profile`);
  }
  const interest = await RoleInterest.findOneAndUpdate(
    { student: req.user.id, role: role._id },
    { student: req.user.id, role: role._id, roleName: role.title, branch: role.branch, committed, recordedAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
  res.status(200).json(new ApiResponse(200, interest, "Interest recorded"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const student = await Student.findOne({ email: email.toLowerCase() });

  if (student) {
    const rawToken = student.createPasswordResetToken();
    await student.save({ validateBeforeSave: false });
    const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}&role=student`;
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      logger.dev(`[DEV] Student password reset link for ${student.email}: ${resetUrl}`);
    }
    await sendEmail({
      to: student.email,
      subject: "Reset your Preyeahh password",
      html: `<p>Hi ${student.name},</p><p>Click below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you didn't request this, ignore this email.</p>`,
    });
  }

  res.status(200).json(new ApiResponse(200, null, "If that email is registered, a reset link has been sent."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const student = await Student.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetTokenHash +passwordResetExpires +refreshTokenVersion");

  if (!student) throw ApiError.badRequest("Reset link is invalid or has expired");

  student.password = password;
  student.passwordResetTokenHash = undefined;
  student.passwordResetExpires = undefined;
  student.refreshTokenVersion = (student.refreshTokenVersion || 0) + 1;
  await student.save();

  res.status(200).json(new ApiResponse(200, null, "Password reset successful. Please log in."));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const student = await Student.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!student) throw ApiError.badRequest("Verification link is invalid or has expired");

  student.isVerified = true;
  student.emailVerificationTokenHash = undefined;
  student.emailVerificationExpires = undefined;
  await student.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, "Email verified. You can now log in."));
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const student = await Student.findOne({ email: email.toLowerCase() });

  if (student && !student.isVerified) {
    const rawToken = student.createEmailVerificationToken();
    await student.save({ validateBeforeSave: false });
    const verifyUrl = `${getClientUrl()}/verify-email/${rawToken}?role=student`;
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      logger.dev(`[DEV] Student verification link for ${student.email}: ${verifyUrl}`);
    }
    await sendEmail({
      to: student.email,
      subject: "Verify your Preyeahh account",
      html: `<p>Click below to verify your email:</p><p><a href="${verifyUrl}">Verify Email</a></p>`,
    });
  }

  res.status(200).json(new ApiResponse(200, null, "If that email needs verification, a link has been sent."));
});

// ── AI learning profile ─────────────────────────────────────────

// POST /api/students/profile/extract   body: { text }
export const extractProfile = asyncHandler(async (req, res) => {
  const result = await profileService.extractAndSaveProfile(req.user.id, req.user.branch, req.body.text);
  res.status(200).json(new ApiResponse(200, result, "Profile extracted and saved"));
});

// PUT /api/students/profile/preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences = await profileService.updatePreferences(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, preferences, "Preferences updated"));
});

// POST /api/students/profile/skip-onboarding
export const skipOnboarding = asyncHandler(async (req, res) => {
  const preferences = await profileService.skipOnboarding(req.user.id);
  res.status(200).json(new ApiResponse(200, preferences, "Onboarding skipped"));
});
