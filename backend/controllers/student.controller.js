import crypto from "crypto";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { issueTokenPair, verifyRefreshToken } from "../services/token.service.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/sendEmail.js";

const ROLE = "student";

// POST /api/students/register  { name, email, password, branch }
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, branch } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  if (await User.findOne({ email: normalizedEmail })) {
    throw new ApiError(409, "User already exists with this email");
  }

  const [firstName, ...rest] = (name || "").trim().split(" ");

  const user = await User.create({
    email: normalizedEmail,
    password,
    firstName: firstName || "",
    lastName: rest.join(" "),
    branch: branch || null,
    role: ROLE,
  });

  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;
  try {
    await sendVerificationEmail(user.email, user.firstName, verificationUrl);
  } catch (err) {
    console.error("Verification email failed:", err.message);
  }

  res
    .status(201)
    .json(new ApiResponse(201, { email: user.email }, "Registered. Check your email to verify your account."));
});

// POST /api/students/login  { email, password }
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: ROLE }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const accessToken = issueTokenPair(user, res);
  res.status(200).json(new ApiResponse(200, { user: user.toSafeJSON(), accessToken }, "Login successful"));
});

// POST /api/students/forgot-password  { email }
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: ROLE });

  // Always 200 — don't leak whether an email exists
  if (user) {
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&role=student`;
    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetUrl);
    } catch (err) {
      console.error("Reset email failed:", err.message);
    }
  }
  res.status(200).json(new ApiResponse(200, null, "If that email exists, a reset link has been sent"));
});

// POST /api/students/reset-password  { token, password }
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token) throw new ApiError(400, "Token is required");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    role: ROLE,
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) throw new ApiError(400, "Reset link is invalid or has expired");

  user.password = password; // pre-save hook hashes it
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenVersion += 1; // invalidate old sessions
  await user.save();

  res.status(200).json(new ApiResponse(200, null, "Password reset successful"));
});

// POST /api/students/resend-verification  { email }
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: ROLE });

  if (user && !user.isVerified) {
    const rawToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;
    try {
      await sendVerificationEmail(user.email, user.firstName, verificationUrl);
    } catch (err) {
      console.error("Verification email failed:", err.message);
    }
  }
  res.status(200).json(new ApiResponse(200, null, "If that email exists, a verification link has been sent"));
});

// POST /api/students/refresh  (reads pp_rt cookie)
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt;
  if (!token) throw new ApiError(401, "No refresh token");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findOne({ _id: decoded.id, role: ROLE });
  if (!user || user.refreshTokenVersion !== decoded.version) {
    throw new ApiError(401, "Refresh token invalidated");
  }

  const accessToken = issueTokenPair(user, res);
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

// POST /api/students/logout  (protected)
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { $inc: { refreshTokenVersion: 1 } });
  res.clearCookie("pp_rt");
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

// GET /api/students/me  (protected)
export const me = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.doc.toSafeJSON(), "Current user"));
});
