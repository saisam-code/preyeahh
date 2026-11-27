import Admin from "../models/Admin.js";
import Branch from "../models/Branch.js";
import Role from "../models/Role.js";
import Beyond from "../models/Beyond.js";
import Guidance from "../models/Guidance.js";
import Guide from "../models/Guide.js";
import RoleRequest from "../models/RoleRequest.js";
import RoleInterest from "../models/RoleInterest.js";
import Student from "../models/Student.js";
import StudentGoal from "../models/StudentGoal.js";
import AuditLog from "../models/AuditLog.js";
import { Institution, InstitutionMembership } from "../models/Institution.js";
import Parent from "../models/Parent.js";
import ParentLink from "../models/ParentLink.js";
import Quiz from "../models/Quiz.js";
import QuizResult from "../models/QuizResult.js";
import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import MentorshipConversation from "../models/MentorshipConversation.js";
import { StudentExperiment, StudentProject, CareerComparison } from "../models/StudentDevelopment.js";
import { CareerOutcome, UserBlock, UserReport } from "../models/SafetyAndOutcomes.js";
import escapeRegex from "../utils/escapeRegex.js";
import Chat from "../models/Chat.js";
import AIRoadmap from "../models/AIRoadmap.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
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

// ── Admin: Student Management ────────────────────────────────────────────────

export const getAllStudents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.branch) filter.branch = req.query.branch.toUpperCase();
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ name: re }, { email: re }];
  }
  if (req.query.verified === "true") filter.isVerified = true;
  if (req.query.verified === "false") filter.isVerified = false;

  const [total, students] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password -emailVerificationTokenHash -emailVerificationExpires -passwordResetTokenHash -passwordResetExpires -refreshTokenVersion"),
  ]);

  res.status(200).json(
    new ApiResponse(200, students, "Students fetched", {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  );
});

export const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).select(
    "-password -emailVerificationTokenHash -emailVerificationExpires -passwordResetTokenHash -passwordResetExpires -refreshTokenVersion"
  );
  if (!student) throw ApiError.notFound("Student not found");
  res.status(200).json(new ApiResponse(200, student, "Student fetched"));
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).select("_id email");
  if (!student) throw ApiError.notFound("Student not found");

  await Promise.all([
    Chat.deleteMany({ studentId: student._id }),
    AIRoadmap.deleteMany({ studentId: student._id }),
    Quiz.deleteMany({ studentId: student._id }),
    QuizResult.deleteMany({ studentId: student._id }),
    PersonalCareerPlan.deleteMany({ student: student._id }),
    StudentGoal.deleteMany({ student: student._id }),
    RoleInterest.deleteMany({ student: student._id }),
    RoleRequest.deleteMany({
      $or: [{ student: student._id }, { email: student.email }],
    }),
    MentorshipConversation.deleteMany({ studentId: student._id }),
    ParentLink.deleteMany({ student: student._id }),
    Parent.updateMany(
      { "associatedStudents.student": student._id },
      { $pull: { associatedStudents: { $or: [{ student: student._id }, { studentEmail: student.email }] } } }
    ),
    InstitutionMembership.deleteMany({ student: student._id }),
    StudentExperiment.deleteMany({ student: student._id }),
    StudentProject.deleteMany({ student: student._id }),
    CareerComparison.deleteMany({ student: student._id }),
    CareerOutcome.deleteMany({ student: student._id }),
    UserReport.deleteMany({
      $or: [
        { reporter: student._id, reporterModel: "Student" },
        { reportedUser: student._id },
      ],
    }),
    UserBlock.deleteMany({ $or: [{ blocker: student._id }, { blockedUser: student._id }] }),
  ]);
  await Student.deleteOne({ _id: student._id });

  res.status(200).json(new ApiResponse(200, { id: student._id }, "Student and associated data deleted"));
});

export const getStudentChats = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).select("name email");
  if (!student) throw ApiError.notFound("Student not found");

  const chats = await Chat.find({ studentId: req.params.studentId })
    .sort({ updatedAt: -1 })
    .select("title topic branch roleId isArchived createdAt updatedAt messages")
    .populate("roleId", "title branch");

  res.status(200).json(new ApiResponse(200, { student, chats }, "Student chats fetched"));
});

export const getStudentChatDetail = asyncHandler(async (req, res) => {
  const reason = (req.query.reason || req.headers["x-audit-reason"] || req.body?.reason || "").trim();
  if (!reason || reason.length < 5) {
    throw ApiError.badRequest("An audit reason of at least 5 characters is required to inspect student transcripts.");
  }

  const chat = await Chat.findOne({
    _id: req.params.chatId,
    studentId: req.params.studentId,
  }).populate("roleId", "title branch");

  if (!chat) throw ApiError.notFound("Chat not found");

  const AuditLog = (await import("../models/AuditLog.js")).default;
  await AuditLog.create({
    adminId: req.user.id,
    adminEmail: req.user.doc?.email || "admin@system",
    action: "VIEW_CHAT_TRANSCRIPT",
    targetId: chat._id,
    targetType: "Chat",
    reason,
    metadata: { studentId: req.params.studentId },
  });

  res.status(200).json(new ApiResponse(200, chat, "Chat fetched"));
});

export const getStudentRoadmaps = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.studentId).select("name email");
  if (!student) throw ApiError.notFound("Student not found");

  const roadmaps = await AIRoadmap.find({ studentId: req.params.studentId })
    .sort({ createdAt: -1 })
    .populate("roleId", "title branch");

  res.status(200).json(new ApiResponse(200, { student, roadmaps }, "Student roadmaps fetched"));
});

export const getAdminOverviewStats = asyncHandler(async (req, res) => {
  const [totalStudents, verifiedStudents, totalChats, totalRoadmaps, totalMessages, totalInstitutions, pendingInstitutions] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ isVerified: true }),
    Chat.countDocuments(),
    AIRoadmap.countDocuments(),
    Chat.aggregate([{ $project: { count: { $size: "$messages" } } }, { $group: { _id: null, total: { $sum: "$count" } } }]),
    Institution.countDocuments(),
    Institution.countDocuments({ status: { $in: ["PENDING", "UNDER_REVIEW"] } }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      totalStudents,
      verifiedStudents,
      unverifiedStudents: totalStudents - verifiedStudents,
      totalChats,
      totalRoadmaps,
      totalMessages: totalMessages[0]?.total || 0,
      totalInstitutions,
      pendingInstitutions,
    }, "Overview stats fetched")
  );
});

export const getAllChats = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.branch && req.query.branch !== "all") filter.branch = req.query.branch.toUpperCase();
  if (req.query.status === "archived") filter.isArchived = true;
  if (req.query.status === "active") filter.isArchived = false;
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ title: re }, { topic: re }, { branch: re }];
  }

  const [total, chats] = await Promise.all([
    Chat.countDocuments(filter),
    Chat.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "name email branch isVerified")
      .populate("roleId", "title branch"),
  ]);

  res.status(200).json(
    new ApiResponse(200, chats, "All chats fetched", {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  );
});

export const getAllRoadmaps = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.branch && req.query.branch !== "all") filter.branch = req.query.branch.toUpperCase();
  if (req.query.level && req.query.level !== "all") filter.level = req.query.level.toLowerCase();
  if (req.query.status === "completed") filter.isCompleted = true;
  if (req.query.status === "in-progress") filter.isCompleted = false;
  if (req.query.search) {
    const re = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ title: re }, { description: re }, { roleTitle: re }];
  }

  const [total, roadmaps] = await Promise.all([
    AIRoadmap.countDocuments(filter),
    AIRoadmap.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("studentId", "name email branch isVerified")
      .populate("roleId", "title branch"),
  ]);

  res.status(200).json(
    new ApiResponse(200, roadmaps, "All roadmaps fetched", {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  );
});

export const getAllMessages = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
  const skip = (page - 1) * limit;

  const matchQuery = {};
  if (req.query.role && (req.query.role === "user" || req.query.role === "assistant")) {
    matchQuery["messages.role"] = req.query.role;
  }
  if (req.query.search) {
    matchQuery["messages.content"] = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
  }

  const chatMatch = { "messages.0": { $exists: true } };
  if (req.query.branch && req.query.branch !== "all") {
    chatMatch.branch = req.query.branch.toUpperCase();
  }

  const pipeline = [
    { $match: chatMatch },
    { $sort: { updatedAt: -1 } },
    { $limit: Math.max(100, limit * 5) },
    { $unwind: "$messages" },
    ...(Object.keys(matchQuery).length ? [{ $match: matchQuery }] : []),
    { $sort: { "messages.createdAt": -1, updatedAt: -1 } },
    {
      $facet: {
        meta: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "student",
            },
          },
          { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              chatId: "$_id",
              chatTitle: "$title",
              branch: "$branch",
              student: {
                _id: "$student._id",
                name: "$student.name",
                email: "$student.email",
                branch: "$student.branch",
              },
              message: "$messages",
            },
          },
        ],
      },
    },
  ];

  const [result] = await Chat.aggregate(pipeline);
  const total = result?.meta?.[0]?.total || 0;
  const items = result?.data || [];

  res.status(200).json(
    new ApiResponse(200, items, "All messages fetched", {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  );
});

export const getDashboardRecent = asyncHandler(async (req, res) => {
  const [recentStudents, recentChats, recentRoadmaps, pendingGuideRequests, pendingRoleRequests, unverifiedCount, pendingInstitutions] = await Promise.all([
    Student.find().sort({ createdAt: -1 }).limit(5).select("name email branch isVerified createdAt"),
    Chat.find().sort({ updatedAt: -1 }).limit(5).populate("studentId", "name email branch isVerified").populate("roleId", "title branch"),
    AIRoadmap.find().sort({ updatedAt: -1 }).limit(5).populate("studentId", "name email branch isVerified").populate("roleId", "title branch"),
    Guide.countDocuments({ status: "pending" }),
    RoleRequest.countDocuments({ status: "pending" }),
    Student.countDocuments({ isVerified: false }),
    Institution.countDocuments({ status: { $in: ["PENDING", "UNDER_REVIEW"] } }),
  ]);

  const recentMessagesAgg = await Chat.aggregate([
    { $unwind: "$messages" },
    { $sort: { "messages.createdAt": -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        chatId: "$_id",
        chatTitle: "$title",
        branch: "$branch",
        studentName: "$student.name",
        studentEmail: "$student.email",
        studentId: "$student._id",
        message: "$messages",
      },
    },
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      recentStudents,
      recentChats,
      recentRoadmaps,
      recentMessages: recentMessagesAgg,
      pending: {
        pendingGuideRequests,
        pendingRoleRequests,
        unverifiedStudents: unverifiedCount,
        pendingInstitutions,
      },
    }, "Recent dashboard activity fetched")
  );
});

// ── Institution management (admin-only) (Phase 1.4) ─────────────────────────

export const getAllInstitutions = asyncHandler(async (req, res) => {
  const institutions = await Institution.find()
    .select("name code category location website contactEmail contactPerson designation phone studentCountApprox status isActive createdAt")
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json(new ApiResponse(200, institutions, "All institutions fetched"));
});

export const updateInstitutionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
    throw ApiError.badRequest("Invalid institution status");
  }

  const inst = await Institution.findById(req.params.id).select("-password -associationCodeHash -refreshTokenVersion");
  if (!inst) throw ApiError.notFound("Institution not found");

  inst.status = status;
  await inst.save();

  res.status(200).json(new ApiResponse(200, inst, `Institution status updated to ${status}`));
});

export const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const filter = {};

  if (typeof req.query.action === "string" && req.query.action) filter.action = req.query.action;
  if (typeof req.query.search === "string" && req.query.search.trim()) {
    const search = new RegExp(escapeRegex(req.query.search.trim()), "i");
    filter.$or = [{ adminEmail: search }, { action: search }, { reason: search }];
  }

  const [total, logs] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("adminEmail action targetId targetType reason createdAt"),
  ]);

  res.status(200).json(
    new ApiResponse(200, logs, "Audit logs fetched", {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  );
});
