import Student from "../models/Student.js";
import Role from "../models/Role.js";
import RoleInterest from "../models/RoleInterest.js";
import Guidance from "../models/Guidance.js";
import Beyond from "../models/Beyond.js";
import Quiz from "../models/Quiz.js";
import AIRoadmap from "../models/AIRoadmap.js";
import Guide from "../models/Guide.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyRefreshToken, issueTokens, clearRefreshCookie } from "../services/tokenService.js";

export const completeGoogleGuideOnboarding = asyncHandler(async (req, res) => {
  const guide = req.user.doc;
  if (!guide.googleId) throw ApiError.forbidden("This endpoint is only for Google-authenticated guides");
  if (!guide.googlePendingOnboarding) throw ApiError.badRequest("Guide onboarding has already been completed");

  const branch = typeof req.body.branch === "string" ? req.body.branch.trim().toUpperCase() : "";
  const roleNames = Array.isArray(req.body.roleNames)
    ? [...new Set(req.body.roleNames.map((roleName) => roleName.trim()).filter(Boolean))]
    : [];
  if (!branch || !roleNames.length) {
    throw ApiError.badRequest("Branch and at least one guide role are required");
  }

  if (typeof req.body.name === "string" && req.body.name.trim()) {
    guide.name = req.body.name.trim();
  }
  guide.branch = branch;
  guide.roleNames = roleNames;
  guide.bio = typeof req.body.bio === "string" ? req.body.bio.trim() : "";
  guide.googlePendingOnboarding = false;
  await guide.save();

  res.status(200).json(
    new ApiResponse(200, { user: guide.toSafeJSON() }, "Guide application submitted for admin approval")
  );
});

export const loginGuide = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const guide = await Guide.findOne({ email: email.toLowerCase() }).select("+password");
  if (!guide || !(await guide.comparePassword(password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!guide.isVerified) throw ApiError.forbidden("Sign in with Google using this email to verify and link your account.");
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
    RoleInterest.find({ branch }).populate("role", "title branch").sort({ createdAt: -1 }).lean(),
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

  const studentsWithInterests = students.filter((student) => interestMap.has(String(student._id))).map((student) => {
    const profileShared = Boolean(student.preferences?.shareProfileWithGuides);
    return {
    id: student._id,
    name: student.name,
    email: student.preferences?.shareContactWithGuides ? student.email : "",
    contactShared: Boolean(student.preferences?.shareContactWithGuides),
    branch: student.branch,
    profile: profileShared ? {
      currentRole: student.preferences.currentRole || "",
      targetRole: student.preferences.targetRole || "",
      experienceLevel: student.preferences.experienceLevel || "",
      learningStyle: student.preferences.learningStyle || "",
      goals: student.preferences.goals || [],
      interests: student.preferences.interests || [],
      skills: (student.preferences.skills || []).map((skill) => skill.name),
    } : null,
    interests: interestMap.get(String(student._id)) || [],
    createdAt: student.createdAt,
  };
  });

  const progressStudentIds = studentsWithInterests.filter((student) => student.profile).map((student) => student.id);
  const expiryFilter = { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] };
  const [roadmapProgress, quizProgress] = await Promise.all([
    AIRoadmap.aggregate([
      { $match: { studentId: { $in: progressStudentIds } } },
      {
        $project: {
          studentId: 1,
          topics: {
            $reduce: {
              input: "$sections",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this.topics"] },
            },
          },
        },
      },
      { $unwind: "$topics" },
      {
        $group: {
          _id: "$studentId",
          totalRoadmapTopics: { $sum: 1 },
          completedRoadmapTopics: { $sum: { $cond: ["$topics.isCompleted", 1, 0] } },
        },
      },
    ]),
    Quiz.aggregate([
      { $match: { studentId: { $in: progressStudentIds }, isCompleted: true, ...expiryFilter } },
      {
        $group: {
          _id: "$studentId",
          completedQuizzes: { $sum: 1 },
          averageQuizScore: { $avg: "$score" },
        },
      },
    ]),
  ]);

  const roadmapByStudent = new Map(roadmapProgress.map((item) => [String(item._id), item]));
  const quizzesByStudent = new Map(quizProgress.map((item) => [String(item._id), item]));
  const studentsWithProgress = studentsWithInterests.map((student) => {
    if (!student.profile) return { ...student, trackRecord: null };
    const roadmap = roadmapByStudent.get(String(student.id));
    const quizzes = quizzesByStudent.get(String(student.id));
    return {
      ...student,
      trackRecord: {
        completedRoadmapTopics: roadmap?.completedRoadmapTopics || 0,
        totalRoadmapTopics: roadmap?.totalRoadmapTopics || 0,
        completedQuizzes: quizzes?.completedQuizzes || 0,
        averageQuizScore: quizzes ? Math.round(quizzes.averageQuizScore) : null,
      },
    };
  });

  res.status(200).json(new ApiResponse(200, {
    branch,
    totalStudents: studentsWithProgress.length,
    totalInterestedStudents: studentsWithProgress.length,
    totalContactSharedStudents: studentsWithProgress.filter((student) => student.contactShared).length,
    totalProfileSharedStudents: studentsWithProgress.filter((student) => student.profile).length,
    totalRoles,
    totalGuidance,
    totalBeyond,
    students: studentsWithProgress,
  }, "Branch overview retrieved"));
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
