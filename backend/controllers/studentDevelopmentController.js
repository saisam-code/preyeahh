import { StudentProject, Opportunity } from "../models/StudentDevelopment.js";
import { Institution, InstitutionMembership } from "../models/Institution.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import escapeRegex from "../utils/escapeRegex.js";

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
    isPublicOnPortfolio: isPublicOnPortfolio === true,
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
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: re }, { description: re }, { eligibility: re }];
  }

  const list = await Opportunity.find(filter).sort({ deadline: 1, createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, list, "Opportunities fetched"));
});

export const createOpportunity = asyncHandler(async (req, res) => {
  const { title, category, description, eligibility, educationLevels, deadline, officialUrl, url, location } = req.body;
  if (!title || !category || !description) {
    throw ApiError.badRequest("Title, category and description are required");
  }

  const opp = await Opportunity.create({
    title: title.trim(),
    category,
    description: description.trim(),
    eligibility: eligibility || "",
    educationLevels: Array.isArray(educationLevels) ? educationLevels : ["Undergraduate"],
    deadline: deadline ? new Date(deadline) : null,
    officialUrl: officialUrl || url || "",
    location: location || "All India",
    isActive: true,
  });

  res.status(201).json(new ApiResponse(201, opp, "Opportunity created successfully"));
});

export const updateOpportunity = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.url && !updates.officialUrl) {
    updates.officialUrl = updates.url;
  }
  delete updates.url;
  const opp = await Opportunity.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!opp) throw ApiError.notFound("Opportunity not found");
  res.status(200).json(new ApiResponse(200, opp, "Opportunity updated successfully"));
});

export const deleteOpportunity = asyncHandler(async (req, res) => {
  const opp = await Opportunity.findByIdAndDelete(req.params.id);
  if (!opp) throw ApiError.notFound("Opportunity not found");
  res.status(200).json(new ApiResponse(200, null, "Opportunity deleted successfully"));
});

/**
 * INSTITUTION ECOSYSTEM
 */
export const listInstitutions = asyncHandler(async (req, res) => {
  const list = await Institution.find({ isActive: true }).select("name code category location").lean();
  res.status(200).json(new ApiResponse(200, list, "Active institutions list"));
});

export const getStudentInstitutionStatus = asyncHandler(async (req, res) => {
  const membership = await InstitutionMembership.findOne({ student: req.user.id, status: "ACTIVE" })
    .populate("institution", "name code category location website")
    .lean();

  res.status(200).json(new ApiResponse(200, membership, "Institution status"));
});
