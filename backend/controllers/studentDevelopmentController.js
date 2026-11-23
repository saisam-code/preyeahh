import { StudentProject, Opportunity } from "../models/StudentDevelopment.js";
import { Institution, InstitutionMembership } from "../models/Institution.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * PROJECTS & PORTFOLIO
 */
export const getStudentProjects = asyncHandler(async (req, res) => {
  const projects = await StudentProject.find({ student: req.user.id }).sort({ completedAt: -1 });
  res.status(200).json(new ApiResponse(200, projects, "Student projects fetched"));
});

export const addStudentProject = asyncHandler(async (req, res) => {
  const { title, description, careerRelevance, skillsUsed, projectType, liveUrl, repoUrl, isPublicOnPortfolio } = req.body;
  if (!title) throw ApiError.badRequest("Project title is required");

  const project = await StudentProject.create({
    student: req.user.id,
    title: title.trim(),
    description,
    careerRelevance,
    skillsUsed: Array.isArray(skillsUsed) ? skillsUsed : [],
    projectType: projectType || "Personal",
    liveUrl,
    repoUrl,
    isPublicOnPortfolio: isPublicOnPortfolio !== false,
  });

  res.status(201).json(new ApiResponse(201, project, "Project added to portfolio"));
});

export const getPublicPortfolio = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const projects = await StudentProject.find({ student: studentId, isPublicOnPortfolio: true }).sort({ completedAt: -1 });
  res.status(200).json(new ApiResponse(200, projects, "Public portfolio fetched"));
});

/**
 * OPPORTUNITIES (Scholarships, Competitions, Internships)
 */
export const listOpportunities = asyncHandler(async (req, res) => {
  const { category, search, stage } = req.query;
  const filter = { isActive: true };

  if (category && category !== "all") filter.category = category;
  if (stage && stage !== "all") filter.educationLevels = stage;
  if (search) {
    const re = new RegExp(search.trim(), "i");
    filter.$or = [{ title: re }, { description: re }, { eligibility: re }];
  }

  const list = await Opportunity.find(filter).sort({ deadline: 1, createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, list, "Opportunities fetched"));
});

/**
 * INSTITUTION ECOSYSTEM
 */
export const listInstitutions = asyncHandler(async (req, res) => {
  const list = await Institution.find({ isActive: true }).select("name code category location").lean();
  res.status(200).json(new ApiResponse(200, list, "Active institutions list"));
});

export const requestInstitutionAssociation = asyncHandler(async (req, res) => {
  const { institutionCode, associationCode, rollNumber } = req.body;
  if (!institutionCode && !associationCode) {
    throw ApiError.badRequest("Institution code or association code is required");
  }

  const query = associationCode ? { associationCode: associationCode.toUpperCase() } : { code: institutionCode.toUpperCase() };
  const inst = await Institution.findOne(query);
  if (!inst) throw ApiError.notFound("Institution not found with provided code");

  // Check existing membership
  let membership = await InstitutionMembership.findOne({ student: req.user.id, institution: inst._id });
  if (membership) {
    return res.status(200).json(new ApiResponse(200, membership, `Current membership status: ${membership.status}`));
  }

  membership = await InstitutionMembership.create({
    student: req.user.id,
    institution: inst._id,
    rollNumberOrStudentId: rollNumber || "",
    status: associationCode ? "ACTIVE" : "PENDING",
    source: associationCode ? "ASSOCIATION_CODE" : "STUDENT_REQUEST",
    joinedAt: associationCode ? new Date() : null,
  });

  res.status(201).json(new ApiResponse(201, membership, "Institution association submitted"));
});

export const getStudentInstitutionStatus = asyncHandler(async (req, res) => {
  const membership = await InstitutionMembership.findOne({ student: req.user.id, status: "ACTIVE" })
    .populate("institution", "name code category location website")
    .lean();

  res.status(200).json(new ApiResponse(200, membership, "Institution status"));
});
