import crypto from "crypto";
import Admin from "../models/Admin.js";
import Branch from "../models/Branch.js";
import Role from "../models/Role.js";
import Beyond from "../models/Beyond.js";
import Guidance from "../models/Guidance.js";
import Guide from "../models/Guide.js";
import RoleRequest from "../models/RoleRequest.js";
import RoleInterest from "../models/RoleInterest.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import sendEmail, { getClientUrl } from "../utils/sendEmail.js";
import { verifyRefreshToken, issueTokens, clearRefreshCookie } from "../services/tokenService.js";

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
  if (!admin || !(await admin.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid credentials");
  }

  const accessToken = issueTokens(res, admin, "admin");
  res.status(200).json(new ApiResponse(200, { accessToken, user: admin.toSafeJSON() }, "Login successful"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt_admin;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }
  if (decoded.role !== "admin") throw ApiError.unauthorized("Invalid refresh token");

  const admin = await Admin.findById(decoded.id).select("+refreshTokenVersion");
  if (!admin) throw ApiError.unauthorized("Account no longer exists");
  if ((admin.refreshTokenVersion || 0) !== decoded.version) {
    throw ApiError.unauthorized("Session expired, please log in again");
  }

  const accessToken = issueTokens(res, admin, "admin");
  res.status(200).json(new ApiResponse(200, { accessToken, user: admin.toSafeJSON() }, "Token refreshed"));
});

export const logoutAdmin = asyncHandler(async (req, res) => {
  clearRefreshCookie(res, "admin");
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (admin) {
    const rawToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });
    const resetUrl = `${getClientUrl()}/reset-password?token=${rawToken}&role=admin`;
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      logger.dev(`[DEV] Admin password reset link for ${admin.email}: ${resetUrl}`);
    }
    await sendEmail({
      to: admin.email,
      subject: "Reset your Preyeahh admin password",
      html: `<p>Click below to reset your password. This link expires in 15 minutes.</p><p><a href="${resetUrl}">Reset Password</a></p>`,
    });
  }

  res.status(200).json(new ApiResponse(200, null, "If that email is registered, a reset link has been sent."));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const admin = await Admin.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetTokenHash +passwordResetExpires +refreshTokenVersion");

  if (!admin) throw ApiError.badRequest("Reset link is invalid or has expired");

  admin.password = password;
  admin.passwordResetTokenHash = undefined;
  admin.passwordResetExpires = undefined;
  admin.refreshTokenVersion = (admin.refreshTokenVersion || 0) + 1;
  await admin.save();

  res.status(200).json(new ApiResponse(200, null, "Password reset successful. Please log in."));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.doc.toSafeJSON(), "Profile fetched"));
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const [branchCount, roleCount, coreCount, nonCoreCount, beyondCount, guidanceCount, pendingGuides, pendingRequests] =
    await Promise.all([
      Branch.countDocuments(),
      Role.countDocuments(),
      Role.countDocuments({ type: "core" }),
      Role.countDocuments({ type: "non-core" }),
      Beyond.countDocuments(),
      Guidance.countDocuments(),
      Guide.countDocuments({ status: "pending" }),
      RoleRequest.countDocuments({ status: "pending" }),
    ]);

  res.status(200).json(
    new ApiResponse(200, {
      branches: branchCount,
      totalRoles: roleCount,
      coreRoles: coreCount,
      nonCoreRoles: nonCoreCount,
      beyondEntries: beyondCount,
      guidanceEntries: guidanceCount,
      pendingGuideRequests: pendingGuides,
      pendingRoleRequests: pendingRequests,
    }, "Dashboard stats fetched")
  );
});

export const getRoleInterest = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch.toUpperCase();
  if (req.query.type === "committed") filter.committed = true;
  if (req.query.type === "exploring") filter.committed = false;

  const rows = await RoleInterest.find(filter).populate("student", "name email").sort({ recordedAt: -1 });
  res.status(200).json(new ApiResponse(200, rows, "Role interest fetched"));
});
