import crypto from "crypto";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

// POST /api/auth/verify-email  { token }
// Shared across roles: the email link carries only a token, and the user's
// role was already fixed at registration — no role param needed to verify.
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, "Token is required");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerificationTokenHash: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) throw new ApiError(400, "Invalid or expired verification token");

  user.isVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  sendWelcomeEmail(user.email, user.firstName).catch((e) =>
    console.error("Welcome email failed:", e.message)
  );

  res.status(200).json(new ApiResponse(200, null, "Email verified successfully"));
});
