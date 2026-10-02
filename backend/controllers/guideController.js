import crypto from "crypto";
import Student from "../models/Student.js";
import Role from "../models/Role.js";
import RoleInterest from "../models/RoleInterest.js";
import Guidance from "../models/Guidance.js";
import Beyond from "../models/Beyond.js";
import Chat from "../models/Chat.js";
import Quiz from "../models/Quiz.js";
import AIRoadmap from "../models/AIRoadmap.js";
import Guide from "../models/Guide.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
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
    logger.dev(`[DEV] Guide verification link for ${guide.email}: ${verifyUrl}`);
  }

  await sendEmail({
    to: guide.email,
    subject: "Verify your Preyeahh guide account",
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

export const getGuideBranchOverview = asyncHandler(async (req, res) => {
  const branch = String(req.user.branch || "").toUpperCase();

  const [students, branchRoleInterests, totalRoles, totalGuidance, totalBeyond] = await Promise.all([
    Student.find({ branch }).select("name email branch preferences createdAt").sort({ createdAt: -1 }).lean(),
    RoleInterest.find({ branch }).populate("student", "name email branch").populate("role", "title branch").sort({ createdAt: -1 }).lean(),
    Role.countDocuments({ branch }),
    Guidance.countDocuments({ $or: [{ branch }, { branch: "All" }] }),
    Beyond.countDocuments({ $or: [{ branch }, { branch: "All" }] }),
  ]);

  const assignedRoleNames = (req.user.doc.roleNames || []).map((name) => String(name).trim().toLowerCase());
  const roleInterests = assignedRoleNames.length
    ? branchRoleInterests.filter((interest) => assignedRoleNames.includes(String(interest.roleName || interest.role?.title || "").trim().toLowerCase()))
    : branchRoleInterests;

  const interestMap = new Map();
  for (const interest of roleInterests) {
    const studentId = String(interest.student?._id || interest.student || "");
    if (!studentId) continue;
    const bucket = interestMap.get(studentId) || [];
    bucket.push({
      id: interest._id,
      role: interest.roleName || interest.role?.title || "Role",
      committed: Boolean(interest.committed),
      recordedAt: interest.recordedAt,
    });
    interestMap.set(studentId, bucket);
  }

  const studentsWithInterests = students.filter((student) => interestMap.has(String(student._id))).map((student) => ({
    id: student._id,
    name: student.name,
    email: student.preferences?.shareContactWithGuides ? student.email : "",
    contactShared: Boolean(student.preferences?.shareContactWithGuides),
    profileShared: Boolean(student.preferences?.shareProfileWithGuides),
    activityShared: Boolean(student.preferences?.shareLearningActivityWithGuides),
    branch: student.branch,
    currentRole: student.preferences?.shareProfileWithGuides ? student.preferences.currentRole || "" : "",
    targetRole: student.preferences?.shareProfileWithGuides ? student.preferences.targetRole || "" : "",
    interests: interestMap.get(String(student._id)) || [],
    createdAt: student.createdAt,
  }));

  res.status(200).json(new ApiResponse(200, {
    branch,
    totalStudents: studentsWithInterests.length,
    totalInterestedStudents: new Set(roleInterests.map((interest) => String(interest.student?._id || interest.student))).size,
    totalContactSharedStudents: studentsWithInterests.filter((student) => student.contactShared).length,
    totalProfileSharedStudents: studentsWithInterests.filter((student) => student.profileShared).length,
    totalActivitySharedStudents: studentsWithInterests.filter((student) => student.activityShared).length,
    totalRoles,
    totalGuidance,
    totalBeyond,
    students: studentsWithInterests,
  }, "Branch overview retrieved"));
});

export const getGuideStudentActivity = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.studentId, branch: req.user.branch })
    .select("name branch preferences");
  if (!student) throw ApiError.notFound("Student not found in your branch");
  if (!student.preferences?.shareLearningActivityWithGuides) {
    throw ApiError.forbidden("This student has not shared their AI learning activity");
  }

  const activeExpiry = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
  const [chats, quizzes, roadmaps] = await Promise.all([
    Chat.find({ studentId: student._id, isArchived: false, ...activeExpiry }).sort({ updatedAt: -1 }).limit(20).lean(),
    Quiz.find({ studentId: student._id, ...activeExpiry }).sort({ updatedAt: -1 }).limit(20).lean(),
    AIRoadmap.find({ studentId: student._id }).sort({ updatedAt: -1 }).limit(20).lean(),
  ]);

  res.status(200).json(new ApiResponse(200, {
    student: { id: student._id, name: student.name, branch: student.branch },
    chats: chats.map((chat) => ({
      id: chat._id,
      title: chat.title,
      topic: chat.topic,
      updatedAt: chat.updatedAt,
      messages: chat.messages.slice(-30).map((message) => ({
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
      })),
    })),
    quizzes: quizzes.map((quiz) => ({
      id: quiz._id,
      title: quiz.title,
      topic: quiz.topic,
      difficulty: quiz.difficulty,
      isCompleted: quiz.isCompleted,
      score: quiz.isCompleted ? quiz.score : null,
      createdAt: quiz.createdAt,
      questions: quiz.questions.map((question, index) => ({
        questionText: question.questionText,
        options: question.options,
        selectedAnswer: quiz.isCompleted ? quiz.userAnswers[index] || "" : "",
        correctAnswer: quiz.isCompleted ? question.correctAnswer : undefined,
        explanation: quiz.isCompleted ? question.explanation : undefined,
      })),
    })),
    roadmaps: roadmaps.map((roadmap) => {
      const topics = roadmap.sections.flatMap((section) => section.topics);
      return {
        id: roadmap._id,
        title: roadmap.title,
        roleTitle: roadmap.roleTitle,
        updatedAt: roadmap.updatedAt,
        completedTopics: topics.filter((topic) => topic.isCompleted).length,
        totalTopics: topics.length,
        estimatedWeeks: roadmap.estimatedWeeks,
      };
    }),
  }, "Shared student learning activity fetched"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const guide = await Guide.findOne({ email: email.toLowerCase() });

  if (guide) {
    const rawToken = guide.createPasswordResetToken();
    await guide.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&role=guide`;
    if (!process.env.SMTP_HOST && process.env.NODE_ENV !== "production") {
      logger.dev(`[DEV] Guide password reset link for ${guide.email}: ${resetUrl}`);
    }
    await sendEmail({
      to: guide.email,
      subject: "Reset your Preyeahh password",
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
      logger.dev(`[DEV] Guide verification link for ${guide.email}: ${verifyUrl}`);
    }
    await sendEmail({
      to: guide.email,
      subject: "Verify your Preyeahh guide account",
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
