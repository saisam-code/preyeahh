import { createHash } from "node:crypto";
import Parent from "../models/Parent.js";
import Student from "../models/Student.js";
import ParentLink from "../models/ParentLink.js";
import RoleInterest from "../models/RoleInterest.js";
import { Institution, InstitutionMembership } from "../models/Institution.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  issueTokens,
  verifyRefreshToken,
  clearRefreshCookie,
} from "../services/tokenService.js";
import { getLearningProgress, getQuizProgress } from "../services/progressService.js";

/**
 * POST /api/auth/extended/parent/register
 * Creates a Parent account. A student link is requested later with their code.
 */
export const registerParent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, relationship } = req.body;
  if (!name || !email || !password) throw ApiError.badRequest("Name, email and password are required");

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await Parent.findOne({ email: normalizedEmail });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const parent = await Parent.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone || "",
    relationship: relationship || "Guardian",
    isVerified: false,
    refreshTokenVersion: 0,
  });

  const accessToken = issueTokens(res, parent, "parent");
  res.status(201).json(
    new ApiResponse(201, { user: parent.toSafeJSON(), accessToken }, "Parent registered successfully")
  );
});

/**
 * POST /api/auth/extended/parent/login
 */
export const loginParent = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest("Email and password are required");

  const normalizedEmail = email.trim().toLowerCase();
  const parent = await Parent.findOne({ email: normalizedEmail }).select("+password");

  if (!parent || !(await parent.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const accessToken = issueTokens(res, parent, "parent");
  res.status(200).json(
    new ApiResponse(200, { user: parent.toSafeJSON(), accessToken }, "Logged in as Parent")
  );
});

/**
 * POST /api/auth/extended/parent/refresh
 * Refreshes access token and rotates refresh cookie for parents
 */
export const refreshParent = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt_parent;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  if (decoded.role !== "parent") throw ApiError.unauthorized("Token role mismatch");

  const parent = await Parent.findById(decoded.id);
  if (!parent) throw ApiError.unauthorized("Parent account no longer exists");

  if (decoded.version !== (parent.refreshTokenVersion || 0)) {
    clearRefreshCookie(res, "parent");
    throw ApiError.unauthorized("Refresh token version revoked. Please log in again.");
  }

  const accessToken = issueTokens(res, parent, "parent");
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

/**
 * GET /api/auth/extended/parent/wards
 * Returns active links and pending requests without exposing student details.
 */
export const getParentWards = asyncHandler(async (req, res) => {
  const links = await ParentLink.find({ parent: req.user.id, status: { $in: ["ACTIVE", "PENDING"] } })
    .populate("student", "name email branch preferences.educationStage preferences.degreeOrProgram");

  const wards = links.map((link) => ({
    linkId: link._id,
    status: link.status,
    permissions: link.permissions,
    parentalConsentGranted: link.parentalConsentGranted,
    student: link.status === "ACTIVE" ? link.student : null,
  }));

  res.status(200).json(new ApiResponse(200, wards, "Active wards retrieved"));
});

/**
 * GET /api/auth/extended/parent/wards/:studentId
 * Guarded: Parent cannot read an unlinked or non-ACTIVE student
 */
export const getParentWardDetail = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const link = await ParentLink.findOne({
    parent: req.user.id,
    student: studentId,
    status: "ACTIVE",
  });

  if (!link) {
    throw ApiError.forbidden("Access denied: You do not have an active link with this student");
  }

  const student = await Student.findById(studentId).select(
    "name email branch dateOfBirth ageBand preferences.educationStage preferences.degreeOrProgram preferences.targetRole preferences.primaryCareerGoal"
  );

  if (!student) throw ApiError.notFound("Student record not found");

  const [interests, learning, quizzes] = await Promise.all([
    link.permissions.viewMilestones
      ? RoleInterest.find({ student: studentId })
        .select("roleName branch committed recordedAt")
        .populate("role", "title domain")
        .lean()
      : [],
    link.permissions.viewPerformance ? getLearningProgress(studentId) : null,
    link.permissions.viewPerformance ? getQuizProgress(studentId) : null,
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        student,
        permissions: link.permissions,
        parentalConsentGranted: link.parentalConsentGranted,
        roles: interests.map((interest) => ({
          title: interest.role?.title || interest.roleName,
          domain: interest.role?.domain || "",
          branch: interest.branch,
          committed: interest.committed,
        })),
        performance: link.permissions.viewPerformance ? { learning, quizzes } : null,
      },
      "Ward details fetched"
    )
  );
});

/**
 * POST /api/auth/extended/parent/links/request
 * Initiates a parent-student connection request
 */
export const requestParentLink = asyncHandler(async (req, res) => {
  const code = typeof req.body.studentCode === "string" ? req.body.studentCode.trim().toUpperCase() : "";
  if (!code) throw ApiError.badRequest("Student link code is required");
  const codeHash = createHash("sha256").update(code).digest("hex");
  const student = await Student.findOne({
    parentLinkCodeHash: codeHash,
    parentLinkCodeExpiresAt: { $gt: new Date() },
  });
  if (!student) throw ApiError.notFound("Student link code is invalid or expired");

  const existing = await ParentLink.findOne({ parent: req.user.id, student: student._id });
  if (existing && existing.status === "ACTIVE") {
    throw ApiError.badRequest("You are already actively linked with this student");
  }

  const link = await ParentLink.findOneAndUpdate(
    { parent: req.user.id, student: student._id },
    {
      parent: req.user.id,
      student: student._id,
      status: "PENDING",
      createdBy: "PARENT",
      parentalConsentGranted: false,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(new ApiResponse(201, link, "Link request sent to student for approval"));
});

/**
 * POST /api/auth/extended/institution/register
 */
export const registerInstitution = asyncHandler(async (req, res) => {
  const { name, code, category, location, website, contactEmail, password, contactPerson, designation } = req.body;
  if (!name || !code || !contactEmail || !password) {
    throw ApiError.badRequest("Institution name, code, official email and password are required");
  }

  const normalizedEmail = contactEmail.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();

  const existing = await Institution.findOne({
    $or: [{ code: normalizedCode }, { contactEmail: normalizedEmail }],
  });
  if (existing) throw ApiError.conflict("An institution with this code or email already exists");

  const inst = new Institution({
    name: name.trim(),
    code: normalizedCode,
    category: category || "College / Institute",
    location: location || "",
    website: website || "",
    contactEmail: normalizedEmail,
    password,
    contactPerson: contactPerson || "",
    designation: designation || "Placement Cell Head",
    status: "PENDING",
    refreshTokenVersion: 0,
  });

  inst.rotateAssociationCode();
  await inst.save();

  const accessToken = issueTokens(res, inst, "institution");
  res.status(201).json(
    new ApiResponse(201, { user: inst.toSafeJSON(), accessToken }, "Institution registered. Pending admin review.")
  );
});

/**
 * POST /api/auth/extended/institution/login
 * Status MUST be APPROVED for login
 */
export const loginInstitution = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest("Email and password are required");

  const normalizedEmail = email.trim().toLowerCase();
  const inst = await Institution.findOne({ contactEmail: normalizedEmail }).select("+password");

  if (!inst || !(await inst.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid credentials for institution");
  }

  // Enforce APPROVED status (item 1.4)
  if (inst.status !== "APPROVED") {
    throw ApiError.forbidden(`Institution access is ${inst.status}. Only APPROVED institutions may log in.`);
  }

  const accessToken = issueTokens(res, inst, "institution");
  res.status(200).json(
    new ApiResponse(200, { user: inst.toSafeJSON(), accessToken }, "Logged in as Institution")
  );
});

/**
 * POST /api/auth/extended/institution/refresh
 */
export const refreshInstitution = asyncHandler(async (req, res) => {
  const token = req.cookies?.pp_rt_institution;
  if (!token) throw ApiError.unauthorized("No refresh token provided");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  if (decoded.role !== "institution") throw ApiError.unauthorized("Token role mismatch");

  const inst = await Institution.findById(decoded.id);
  if (!inst) throw ApiError.unauthorized("Institution no longer exists");

  if (inst.status !== "APPROVED") {
    clearRefreshCookie(res, "institution");
    throw ApiError.forbidden("Institution is not approved");
  }

  if (decoded.version !== (inst.refreshTokenVersion || 0)) {
    clearRefreshCookie(res, "institution");
    throw ApiError.unauthorized("Refresh token version revoked. Please log in again.");
  }

  const accessToken = issueTokens(res, inst, "institution");
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

/**
 * GET /api/auth/extended/institution/members
 * Scoped to authenticated institution
 */
export const getInstitutionMembers = asyncHandler(async (req, res) => {
  const members = await InstitutionMembership.find({ institution: req.user.id })
    .populate("student", "name email branch preferences.educationStage")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, members, "Institution members retrieved"));
});

/**
 * PUT /api/auth/extended/institution/members/:id/approve
 * Approves a pending student membership
 */
export const approveInstitutionMember = asyncHandler(async (req, res) => {
  const membership = await InstitutionMembership.findOne({
    _id: req.params.id,
    institution: req.user.id,
  });

  if (!membership) throw ApiError.notFound("Membership record not found");

  // One ACTIVE membership per student rule
  await InstitutionMembership.updateMany(
    { student: membership.student, status: "ACTIVE", _id: { $ne: membership._id } },
    { $set: { status: "REMOVED" } }
  );

  membership.status = "ACTIVE";
  membership.approvedAt = new Date();
  await membership.save();

  res.status(200).json(new ApiResponse(200, membership, "Student membership approved"));
});

/**
 * PUT /api/auth/extended/institution/members/:id/remove
 */
export const removeInstitutionMember = asyncHandler(async (req, res) => {
  const membership = await InstitutionMembership.findOne({
    _id: req.params.id,
    institution: req.user.id,
  });

  if (!membership) throw ApiError.notFound("Membership record not found");

  membership.status = "REMOVED";
  await membership.save();

  res.status(200).json(new ApiResponse(200, membership, "Student removed from cohort"));
});

/**
 * POST /api/auth/extended/institution/rotate-code
 */
export const rotateInstitutionCode = asyncHandler(async (req, res) => {
  const inst = await Institution.findById(req.user.id);
  if (!inst) throw ApiError.notFound("Institution not found");

  const rawCode = inst.rotateAssociationCode();
  await inst.save();

  res.status(200).json(
    new ApiResponse(200, { associationCode: rawCode }, "Association code rotated successfully")
  );
});

/**
 * GET /api/auth/extended/me
 */
export const getExtendedMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, req.user.doc.toSafeJSON(), "Profile fetched"));
});

/**
 * POST /api/auth/extended/logout
 * Invalidates refresh token version and clears refresh cookie
 */
export const logoutExtended = asyncHandler(async (req, res) => {
  const role = req.user?.role || "parent";
  if (req.user?.doc) {
    req.user.doc.refreshTokenVersion = (req.user.doc.refreshTokenVersion || 0) + 1;
    await req.user.doc.save();
  }
  clearRefreshCookie(res, role);
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});
