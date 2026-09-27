import crypto from "crypto";
import User from "../models/User.js";

import { getGroqClient, GROQ_MODEL } from "../config/groq.js";
import { buildProfileExtractionPrompt } from "../utils/aiPrompts.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import {
  issueTokenPair,
  verifyRefreshToken,
} from "../services/token.service.js";

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/sendEmail.js";

const ROLE = "student";

/* =========================================================
   AUTH
   ========================================================= */

// POST /api/students/register
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

  const verificationUrl =
    `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;

  try {
    await sendVerificationEmail(
      user.email,
      user.firstName,
      verificationUrl
    );
  } catch (err) {
    console.error("Verification email failed:", err.message);
  }

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email: user.email },
        "Registered. Check your email to verify your account."
      )
    );
});

// POST /api/students/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: ROLE,
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(
      403,
      "Please verify your email before logging in"
    );
  }

  const accessToken = issueTokenPair(user, res);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          user: user.toSafeJSON(),
          accessToken,
        },
        "Login successful"
      )
    );
});

// POST /api/students/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: ROLE,
  });

  if (user) {
    const rawToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    const resetUrl =
      `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&role=student`;

    try {
      await sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetUrl
      );
    } catch (err) {
      console.error("Reset email failed:", err.message);
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "If that email exists, a reset link has been sent"
      )
    );
});

// POST /api/students/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token) {
    throw new ApiError(400, "Token is required");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetTokenHash: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    role: ROLE,
  }).select(
    "+passwordResetTokenHash +passwordResetExpires"
  );

  if (!user) {
    throw new ApiError(
      400,
      "Reset link is invalid or has expired"
    );
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenVersion += 1;

  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Password reset successful"
      )
    );
});

// POST /api/students/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    role: ROLE,
  });

  if (user && !user.isVerified) {
    const rawToken = user.createEmailVerificationToken();

    await user.save({ validateBeforeSave: false });

    const verificationUrl =
      `${process.env.FRONTEND_URL}/verify-email/${rawToken}`;

    try {
      await sendVerificationEmail(
        user.email,
        user.firstName,
        verificationUrl
      );
    } catch (err) {
      console.error(
        "Verification email failed:",
        err.message
      );
    }
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "If that email exists, a verification link has been sent"
      )
    );
});

// POST /api/students/refresh
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt;

  if (!token) {
    throw new ApiError(401, "No refresh token");
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(
      401,
      "Invalid or expired refresh token"
    );
  }

  const user = await User.findOne({
    _id: decoded.id,
    role: ROLE,
  });

  if (
    !user ||
    user.refreshTokenVersion !== decoded.version
  ) {
    throw new ApiError(
      401,
      "Refresh token invalidated"
    );
  }

  const accessToken = issueTokenPair(user, res);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { accessToken },
        "Token refreshed"
      )
    );
});

// POST /api/students/logout
export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, {
    $inc: {
      refreshTokenVersion: 1,
    },
  });

  res.clearCookie("pp_rt");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        null,
        "Logged out"
      )
    );
});

// GET /api/students/me
export const me = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user.doc.toSafeJSON(),
        "Current user"
      )
    );
});


/* =========================================================
   AI PROFILE / PREFERENCES
   ========================================================= */

// POST /api/students/profile/extract
export const extractProfileController = async (
  req,
  res,
  next
) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a description of at least 10 characters",
      });
    }

    const user = await User.findOne({
      _id: req.user.id,
      role: ROLE,
    }).select("branch preferences");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const groq = getGroqClient();

    const prompt = buildProfileExtractionPrompt(
      text.trim(),
      user.branch || ""
    );

    const completion =
      await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
        temperature: 0.2,
        max_tokens: 1024,
      });

    let extracted;

    try {
      extracted = JSON.parse(
        completion.choices[0]?.message?.content || "{}"
      );
    } catch {
      return res.status(500).json({
        success: false,
        message:
          "AI returned invalid data. Please try again.",
      });
    }

    const setFields = {};

    /*
     * Only write fields that actually exist in User.preferences.
     * User.js currently defines:
     * - skills
     * - experienceLevel
     * - learningStyle
     * - aiProfileSummary
     */

    if (extracted.experienceLevel) {
      setFields["preferences.experienceLevel"] =
        extracted.experienceLevel;
    }

    if (extracted.learningStyle) {
      setFields["preferences.learningStyle"] =
        extracted.learningStyle;
    }

    if (extracted.aiProfileSummary) {
      setFields["preferences.aiProfileSummary"] =
        extracted.aiProfileSummary;
    }

    if (
      Array.isArray(extracted.skills) &&
      extracted.skills.length > 0
    ) {
      setFields["preferences.skills"] =
        extracted.skills;
    }

    const updated = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        role: ROLE,
      },
      {
        $set: setFields,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshTokenVersion");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Profile extracted and saved successfully",
      preferences: updated.preferences,
      extracted,
    });
  } catch (err) {
    if (
      err.status === 429 ||
      err.statusCode === 429 ||
      err.message?.includes("429") ||
      err.message?.includes("rate_limit")
    ) {
      return res.status(429).json({
        success: false,
        message:
          "AI service is temporarily unavailable. Please try again shortly.",
        retryAfter: 60,
      });
    }

    next(err);
  }
});

// PATCH /api/students/preferences
export const updatePreferencesController = async (
  req,
  res,
  next
) => {
  try {
    const {
      experienceLevel,
      skills,
      learningStyle,
      aiProfileSummary,
    } = req.body;

    const setFields = {};

    if (experienceLevel !== undefined) {
      setFields["preferences.experienceLevel"] =
        experienceLevel;
    }

    if (skills !== undefined) {
      setFields["preferences.skills"] = skills;
    }

    if (learningStyle !== undefined) {
      setFields["preferences.learningStyle"] =
        learningStyle;
    }

    if (aiProfileSummary !== undefined) {
      setFields["preferences.aiProfileSummary"] =
        aiProfileSummary;
    }

    const updated = await User.findOneAndUpdate(
      {
        _id: req.user.id,
        role: ROLE,
      },
      {
        $set: setFields,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshTokenVersion");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      preferences: updated.preferences,
    });
  } catch (err) {
    next(err);
  }
};