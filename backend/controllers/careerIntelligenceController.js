import Role from "../models/Role.js";
import { StudentExperiment, CareerComparison, StudentProject, Opportunity } from "../models/StudentDevelopment.js";
import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatCompletion } from "../services/groqService.js";
import escapeRegex from "../utils/escapeRegex.js";

/**
 * GET /api/career-intelligence/roles
 * Discovers careers across conventional, unconventional, and emerging categories
 * with educationStage, domain, and branch filters
 */
export const discoverCareers = asyncHandler(async (req, res) => {
  const { category, domain, branch, stage, search } = req.query;
  const filter = {};

  if (category && category !== "all") filter.category = category;
  if (domain && domain !== "all") filter.domain = domain;
  if (branch && branch !== "all") filter.branch = branch.toUpperCase();
  if (stage && stage !== "all") filter.educationStages = stage;
  if (search) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: re }, { description: re }, { domain: re }];
  }

  const roles = await Role.find(filter).sort({ title: 1 }).lean();

  // Phase 3.4: Group by title to eliminate duplicate-per-branch card clutter in discovery
  let resultRoles = roles;
  if (!branch || branch === "all") {
    const groupedMap = new Map();
    for (const r of roles) {
      const key = r.title.trim().toLowerCase();
      if (!groupedMap.has(key)) {
        groupedMap.set(key, { ...r, branches: [r.branch] });
      } else {
        const existing = groupedMap.get(key);
        if (r.branch && !existing.branches.includes(r.branch)) {
          existing.branches.push(r.branch);
        }
        if (!existing.reality?.salary?.value && r.reality?.salary?.value) {
          existing.reality = r.reality;
        }
      }
    }
    resultRoles = Array.from(groupedMap.values());
  }

  res.status(200).json(new ApiResponse(200, resultRoles, "Careers discovered"));
});

/**
 * GET /api/career-intelligence/roles/:id/reality
 * Returns verified reality, salary insights, risks, and financial breakdown
 */
export const getCareerReality = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw ApiError.notFound("Career role not found");

  res.status(200).json(
    new ApiResponse(200, {
      roleId: role._id,
      title: role.title,
      branch: role.branch,
      domain: role.domain,
      category: role.category,
      reality: role.reality,
      guidance: role.guidance,
      experiments: role.experiments || [],
      verification: role.verification,
    }, "Career reality details fetched")
  );
});

/**
 * POST /api/career-intelligence/compare
 * Compares 2 to 5 careers simultaneously with AI breakdown if requested
 */
export const compareCareers = asyncHandler(async (req, res) => {
  const { roleIds } = req.body;
  if (!Array.isArray(roleIds) || roleIds.length < 2 || roleIds.length > 5) {
    throw ApiError.badRequest("Please select between 2 and 5 careers to compare");
  }

  const roles = await Role.find({ _id: { $in: roleIds } }).lean();
  if (roles.length < 2) throw ApiError.badRequest("At least 2 valid roles must be found");

  let aiAnalysis = "";
  try {
    const prompt = `Compare these careers concisely for a student:\n` +
      roles.map((r) => `- ${r.title} (${r.branch || "General"}): Domain: ${r.domain}, Salary range: ${JSON.stringify(r.reality?.salaryRange || {})}, Costs: ${JSON.stringify(r.reality?.costs || {})}`).join("\n") +
      `\nHighlight differences in entry barriers, day-to-day reality, transferable skills, and realistic outcomes. Keep it honest and practical.`;

    aiAnalysis = await chatCompletion(
      [
        { role: "system", content: "You are Preyeahh's Career Intelligence specialist. Never fabricate guaranteed salaries or jobs." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.4, maxTokens: 800 },
    );
  } catch (err) {
    aiAnalysis = "AI comparative insights currently unavailable. Review the side-by-side factual metrics below.";
  }

  if (req.user && req.user.role === "student") {
    await CareerComparison.create({
      student: req.user.id,
      roleIds: roles.map((r) => r._id),
      aiAnalysis,
    }).catch(() => {});
  }

  res.status(200).json(
    new ApiResponse(200, { roles, aiAnalysis }, "Career comparison generated")
  );
});

/**
 * POST /api/career-intelligence/switch-analysis
 * Analyzes transition feasibility between current and target career
 */
export const analyzeCareerSwitch = asyncHandler(async (req, res) => {
  const { currentCareer, targetCareer, currentSkills = [] } = req.body;
  if (!targetCareer) throw ApiError.badRequest("Target career is required");

  const prompt = `Student is considering switching from "${currentCareer || 'Current Background'}" to "${targetCareer}".
Current skills: ${currentSkills.join(", ") || "General academics"}.
Provide:
1. Transferable skills
2. Missing critical skills
3. Additional education / training needed
4. Estimated transition timeline
5. 2 small practical experiments to try before fully committing.
Be encouraging, realistic, and do not guarantee placement.`;

  let analysis = "";
  try {
    analysis = await chatCompletion(
      [
        { role: "system", content: "You are a career transition specialist." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.5, maxTokens: 750 },
    );
  } catch (err) {
    analysis = "Career switch analysis temporarily unavailable. Focus on bridging fundamental technical and practical project skills.";
  }

  res.status(200).json(new ApiResponse(200, { analysis }, "Switch analysis completed"));
});

/**
 * Career Experiments API (Student starts, logs evidence, and completes)
 */
export const startExperiment = asyncHandler(async (req, res) => {
  const { roleId, experimentTitle, careerDomain } = req.body;
  if (!experimentTitle) throw ApiError.badRequest("Experiment title is required");

  const experiment = await StudentExperiment.create({
    student: req.user.id,
    role: roleId || null,
    experimentTitle,
    careerDomain: careerDomain || "",
    status: "in_progress",
  });

  // Wire to student's PersonalCareerPlan so it appears in their active daily/weekly schedule
  try {
    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
    await PersonalCareerPlan.findOneAndUpdate(
      { student: req.user.id },
      {
        $push: {
          tasks: {
            title: `Experiment: ${experimentTitle}`,
            category: "Career experiment",
            priority: "High",
            status: "Not Started",
            scheduledDate: todayStr,
            durationMinutes: 60,
            notes: `Domain: ${careerDomain || "General"} · Experiment ID: ${experiment._id}`,
          },
        },
      },
      { upsert: true }
    );
  } catch {
    // Non-fatal: experiment record was created
  }

  res.status(201).json(new ApiResponse(201, experiment, "Career experiment started and added to planner"));
});

export const getStudentExperiments = asyncHandler(async (req, res) => {
  const list = await StudentExperiment.find({ student: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, list, "Student experiments fetched"));
});

export const completeExperiment = asyncHandler(async (req, res) => {
  const { evidenceUrl, reflectionNotes, skillsGained = [], rating } = req.body;
  const exp = await StudentExperiment.findOne({ _id: req.params.id, student: req.user.id });
  if (!exp) throw ApiError.notFound("Experiment not found");

  exp.status = "completed";
  exp.completedAt = new Date();
  if (evidenceUrl) exp.evidenceUrl = evidenceUrl;
  if (reflectionNotes) exp.reflectionNotes = reflectionNotes;
  if (skillsGained.length) exp.skillsGained = skillsGained;
  if (rating) exp.rating = rating;
  await exp.save();

  res.status(200).json(new ApiResponse(200, exp, "Experiment marked as completed"));
});
