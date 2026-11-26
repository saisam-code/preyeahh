import Student from "../models/Student.js";
import Role from "../models/Role.js";
import Branch from "../models/Branch.js";
import RoleInterest from "../models/RoleInterest.js";
import StudentGoal from "../models/StudentGoal.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyRefreshToken, issueTokens, clearRefreshCookie } from "../services/tokenService.js";
import * as profileService from "../services/profileService.js";
import { requestMembershipByAssociationCode } from "../services/institutionService.js";

export const loginStudent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const student = await Student.findOne({ email: email.toLowerCase() }).select("+password");
  if (!student) throw ApiError.unauthorized("Invalid email or password");

  // Prevent account enumeration by checking password safely
  if (!student.password || !(await student.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!student.isVerified) {
    throw ApiError.forbidden("Sign in with Google using this email to verify and link your account.");
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

export const getStudentGoals = asyncHandler(async (req, res) => {
  const goals = await StudentGoal.find({ student: req.user.id })
    .select("goalTitle type status roleId origin previousGoalTitle changeReason createdAt updatedAt")
    .sort({ type: 1, updatedAt: -1 })
    .lean();
  res.status(200).json(new ApiResponse(200, goals, "Career goals fetched"));
});

export const changeStudentGoal = asyncHandler(async (req, res) => {
  const { goalTitle, type = "EXPLORING", status = "ACTIVE", origin = "DISCOVERY", changeReason = "", previousGoalTitle = "" } = req.body;
  const title = typeof goalTitle === "string" ? goalTitle.trim() : "";
  if (!title) throw ApiError.badRequest("Goal title is required");
  if (!["PRIMARY", "ALTERNATIVE", "EXPLORING", "INTEREST"].includes(type)) {
    throw ApiError.badRequest("Invalid career goal type");
  }
  if (!["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"].includes(status)) {
    throw ApiError.badRequest("Invalid career goal status");
  }
  if (!["DISCOVERY", "CHILDHOOD_DREAM", "CURRENT_GOAL", "SWITCH_TARGET"].includes(origin)) {
    throw ApiError.badRequest("Invalid career goal origin");
  }

  const existing = await StudentGoal.findOne({ student: req.user.id, goalTitle: title });
  if (existing) {
    existing.type = type;
    existing.status = status;
    existing.origin = origin;
    existing.changeReason = typeof changeReason === "string" ? changeReason.trim().slice(0, 500) : "";
    existing.previousGoalTitle = typeof previousGoalTitle === "string" ? previousGoalTitle.trim().slice(0, 120) : "";
    await existing.save();
    return res.status(200).json(new ApiResponse(200, existing, "Career goal updated"));
  }

  const created = await StudentGoal.create({
    student: req.user.id,
    goalTitle: title,
    type,
    status,
    origin,
    changeReason: typeof changeReason === "string" ? changeReason.trim().slice(0, 500) : "",
    previousGoalTitle: typeof previousGoalTitle === "string" ? previousGoalTitle.trim().slice(0, 120) : "",
  });
  res.status(201).json(new ApiResponse(201, created, "Career goal saved"));
});

export const getInterestForRole = asyncHandler(async (req, res) => {
  const interest = await RoleInterest.findOne({ student: req.user.id, role: req.params.roleId });
  res.status(200).json(new ApiResponse(200, interest ? { committed: interest.committed } : null, "Interest checked"));
});

export const recordInterest = asyncHandler(async (req, res) => {
  const { roleId, committed } = req.body;
  const role = await Role.findById(roleId);
  if (!role) throw ApiError.notFound("Role not found");
  const interest = await RoleInterest.findOneAndUpdate(
    { student: req.user.id, role: role._id },
    { student: req.user.id, role: role._id, roleName: role.title, branch: role.branch, committed, recordedAt: new Date() },
    { upsert: true, new: true, runValidators: true }
  );
  if (committed) {
    const existingGoal = await StudentGoal.findOne({
      student: req.user.id,
      roleId: role._id,
      status: "ACTIVE",
    });
    if (existingGoal) {
      existingGoal.type = "INTEREST";
      existingGoal.goalTitle = role.title;
      await existingGoal.save();
    } else {
      await StudentGoal.create({
        student: req.user.id,
        roleId: role._id,
        goalTitle: role.title,
        type: "INTEREST",
        status: "ACTIVE",
      });
    }
  } else {
    await StudentGoal.updateMany(
      { student: req.user.id, roleId: role._id, type: "INTEREST", status: "ACTIVE" },
      { $set: { status: "ABANDONED" } }
    );
  }
  res.status(200).json(new ApiResponse(200, interest, "Interest recorded"));
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

// ── Google OAuth onboarding ──────────────────────────────────────────────────

/**
 * POST /api/students/google-onboarding
 * Called by the frontend after a new Google student supplies their branch.
 * The student is authenticated via a short-lived onboarding-only token
 * (protectGoogleOnboarding), NOT a normal application JWT.
 * After successful onboarding, normal application tokens are issued.
 */
export const completeGoogleOnboarding = asyncHandler(async (req, res) => {
  let student = req.user.doc;

  if (!student.googleId) {
    throw ApiError.forbidden("This endpoint is only for Google-authenticated accounts");
  }

  if (!student.googlePendingOnboarding) {
    // Already completed — issue normal tokens and return current profile
    const accessToken = issueTokens(res, student, "student");
    return res.status(200).json(new ApiResponse(200, { accessToken, user: student.toSafeJSON() }, "Onboarding already completed"));
  }

  const { branch, name, profile } = req.body;
  const normalizedBranch = typeof branch === "string" ? branch.trim().toUpperCase() : "";

  if (normalizedBranch) {
    const existingBranch = await Branch.findOne({ name: normalizedBranch });
    if (!existingBranch) throw ApiError.badRequest("Invalid branch");
    student.branch = normalizedBranch;
  } else {
    student.branch = "";
  }
  if (name && name.trim()) student.name = name.trim();
  const profileFields = [
    "educationStage",
    "academicStream",
    "degreeOrProgram",
    "specialization",
    "yearOfStudy",
    "semester",
    "expectedGraduationYear",
    "schoolOrInstitution",
    "board",
    "subjects",
    "country",
    "state",
    "city",
    "currentRole",
    "interests",
    "primaryCareerGoal",
    "alternativeCareerGoal",
    "targetRole",
    "childhoodDream",
    "formerCareerGoal",
    "careerSwitchReason",
    "skills",
    "weeklyHoursAvailable",
    "careerPreference",
    "learningStyle",
    "preferredLanguage",
    "onboardingCompleted",
    "onboardingStep",
  ];
  const onboardingProfile = Object.fromEntries(
    profileFields
      .filter((field) => profile && Object.hasOwn(profile, field))
      .map((field) => [field, profile[field]])
  );
  if (Object.keys(onboardingProfile).length) {
    if (typeof onboardingProfile.onboardingCompleted !== "boolean") {
      onboardingProfile.onboardingCompleted = false;
    }
    student = await profileService.updatePreferences(student.id, onboardingProfile);
  }

  student.googlePendingOnboarding = false;
  await student.save({ validateBeforeSave: false });

  // Onboarding complete — now issue the normal application access/refresh tokens
  const accessToken = issueTokens(res, student, "student");

  res.status(200).json(new ApiResponse(200, { accessToken, user: student.toSafeJSON() }, "Onboarding completed"));
});

// ── ParentLink & Institution Association (Phase 1.3, 1.4) ──────────────────────

/**
 * GET /api/students/parent-links
 */
export const getStudentParentLinks = asyncHandler(async (req, res) => {
  const ParentLink = (await import("../models/ParentLink.js")).default;
  const links = await ParentLink.find({ student: req.user.id })
    .populate("parent", "name email phone relationship")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, links, "Parent links retrieved"));
});

/**
 * PUT /api/students/parent-links/:id/status
 */
export const updateStudentParentLinkStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["ACTIVE", "REVOKED"].includes(status)) {
    throw ApiError.badRequest("Status must be ACTIVE or REVOKED");
  }

  const ParentLink = (await import("../models/ParentLink.js")).default;
  const link = await ParentLink.findOne({ _id: req.params.id, student: req.user.id });
  if (!link) throw ApiError.notFound("Parent link request not found");

  link.status = status;
  if (status === "ACTIVE") {
    link.parentalConsentGranted = true;
    link.consentGrantedAt = new Date();
  } else if (status === "REVOKED") {
    link.revokedAt = new Date();
  }
  await link.save();

  res.status(200).json(new ApiResponse(200, link, `Parent link ${status.toLowerCase()} successfully`));
});

/**
 * POST /api/students/institution-associate
 * Uses association code to create a PENDING membership (never directly ACTIVE)
 */
export const associateWithInstitution = asyncHandler(async (req, res) => {
  const { institution, membership } = await requestMembershipByAssociationCode({
    studentId: req.user.id,
    associationCode: req.body.associationCode,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      membership,
      `Association request submitted for ${institution.name}. Pending campus coordinator approval.`
    )
  );
});
