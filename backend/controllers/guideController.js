import crypto from "crypto";
import Guide from "../models/Guide.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { verifyRefreshToken, issueTokens, clearRefreshCookie } from "../services/tokenService.js";

export const registerGuide = asyncHandler(async (req, res) => {
  const { name, email, password, branch, roleNames, bio } = req.body;

  const existing = await Guide.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const guide = await Guide.create({ name, email, password, branch, roleNames, bio });

  const rawToken = guide.createEmailVerificationToken();
  await guide.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}?role=guide`;
  if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Guide verification link for ${guide.email}: ${verifyUrl}`);
  }

  await sendEmail({
    to: guide.email,
    subject: "Verify your Pre-Yeah guide account",
    html: `<p>Hi ${guide.name},</p><p>Verify your email first, then the admin will review your registration:</p><p><a href="${verifyUrl}">Verify Email</a></p>`,
  });

  res.status(201).json(
    new ApiResponse(201, guide.toSafeJSON(), "Registration submitted. Check your email to verify it, then wait for admin approval.")
  );
});

export const loginGuide = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const guide = await Guide.findOne({ email: email.toLowerCase() }).select("+password");
  if (!guide || !(await guide.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!guide.isVerified) throw ApiError.forbidden("Please verify your email before logging in.");
  if (guide.status === "pending") throw ApiError.forbidden("Your guide registration is pending admin approval.");
  if (guide.status === "rejected") throw ApiError.forbidden("Your guide registration was not approved.");

  const accessToken = issueTokens(res, guide, "guide");
  res.status(200).json(new ApiResponse(200, { accessToken, user: guide.toSafeJSON() }, "Login successful"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt_guide;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
  if (decoded.role !== "guide") throw ApiError.unauthorized("Invalid refresh token");

  const guide = await Guide.findById(decoded.id).select("+refreshTokenVersion");
  if (!guide) throw ApiError.unauthorized("Account no longer exists");
  if ((guide.refreshTokenVersion || 0) !== decoded.version) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  const accessToken = issueTokens(res, guide, "guide");
  res.status(200).json(new ApiResponse(200, { accessToken, user: guide.toSafeJSON() }, "Token refreshed"));
});

export const logoutGuide = asyncHandler(async (req, res) => {
  clearRefreshCookie(res, "guide");
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.doc.toSafeJSON(), "Profile fetched"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const guide = await Guide.findOne({ email: email.toLowerCase() });

  if (guide) {
    const rawToken = guide.createPasswordResetToken();
    await guide.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&role=guide`;
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Guide password reset link for ${guide.email}: ${resetUrl}`);
    }
    await sendEmail({
      to: guide.email,
      subject: "Reset your Pre-Yeah password",
      html: `<p>Click below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">Reset Password</a></p>`,
    });
  }

  res.status(200).json(new ApiResponse(200, null, "If that email is registered, a reset link has been sent."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const guide = await Guide.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetTokenHash +passwordResetExpires +refreshTokenVersion");

  if (!guide) throw ApiError.badRequest("Reset link is invalid or has expired");

  guide.password = password;
  guide.passwordResetTokenHash = undefined;
  guide.passwordResetExpires = undefined;
  guide.refreshTokenVersion = (guide.refreshTokenVersion || 0) + 1;
  await guide.save();

  res.status(200).json(new ApiResponse(200, null, "Password reset successful. Please log in."));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const guide = await Guide.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!guide) throw ApiError.badRequest("Verification link is invalid or has expired");

  guide.isVerified = true;
  guide.emailVerificationTokenHash = undefined;
  guide.emailVerificationExpires = undefined;
  await guide.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, null, "Email verified."));
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const guide = await Guide.findOne({ email: email.toLowerCase() });

  if (guide && !guide.isVerified) {
    const rawToken = guide.createEmailVerificationToken();
    await guide.save({ validateBeforeSave: false });
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${rawToken}?role=guide`;
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Guide verification link for ${guide.email}: ${verifyUrl}`);
    }
    await sendEmail({
      to: guide.email,
      subject: "Verify your Pre-Yeah guide account",
      html: `<p>Click below to verify your email:</p><p><a href="${verifyUrl}">Verify Email</a></p>`,
    });
  }

  res.status(200).json(new ApiResponse(200, null, "If that email needs verification, a link has been sent."));
});

// ── Admin-only guide management (unchanged) ──

export const listGuides = asyncHandler(async (req, res) => {
  const guides = await Guide.find().sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, guides.map((g) => g.toSafeJSON()), "Guides fetched"));
});

export const setGuideStatus = asyncHandler(async (req, res) => {
  const guide = await Guide.findById(req.params.id);
  if (!guide) throw ApiError.notFound("Guide not found");
  guide.status = req.body.status;
  await guide.save();
  res.status(200).json(new ApiResponse(200, guide.toSafeJSON(), "Guide status updated"));
});

export const assignGuideRoles = asyncHandler(async (req, res) => {
  const guide = await Guide.findById(req.params.id);
  if (!guide) throw ApiError.notFound("Guide not found");
  guide.roleNames = req.body.roleNames;
  await guide.save();
  res.status(200).json(new ApiResponse(200, guide.toSafeJSON(), "Assigned roles updated"));
});

export const deleteGuide = asyncHandler(async (req, res) => {
  const guide = await Guide.findByIdAndDelete(req.params.id);
  if (!guide) throw ApiError.notFound("Guide not found");
  res.status(200).json(new ApiResponse(200, null, "Guide deleted"));
});
