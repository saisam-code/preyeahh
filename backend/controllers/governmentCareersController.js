import { GovernmentJob, GovernmentNotification } from "../models/GovernmentCareer.js";
import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import StudentGoal from "../models/StudentGoal.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatCompletion } from "../services/groqService.js";
import { SAMPLE_GOVERNMENT_JOBS, SAMPLE_GOVERNMENT_NOTIFICATIONS } from "../data/seedGovernmentCareers.js";
import escapeRegex from "../utils/escapeRegex.js";
import { normalizeEducationStage } from "../constants/educationStages.js";

/**
 * Ensures baseline verified government careers exist in DB.
 */
async function ensureGovernmentDataSeeded() {
  const count = await GovernmentJob.countDocuments();
  if (count === 0) {
    await GovernmentJob.insertMany(SAMPLE_GOVERNMENT_JOBS).catch(() => {});
  }
  const notifCount = await GovernmentNotification.countDocuments();
  if (notifCount === 0) {
    await GovernmentNotification.insertMany(SAMPLE_GOVERNMENT_NOTIFICATIONS).catch(() => {});
  }
}

/**
 * GET /api/government-careers/jobs
 * Query params: category, qualification, level, state, stage, search, minPay
 */
export const getGovernmentJobs = asyncHandler(async (req, res) => {
  await ensureGovernmentDataSeeded();

  const { category, qualification, level, state, stage, search, minPay } = req.query;
  const filter = { isActive: true };

  if (category && category !== "all") {
    filter.category = category;
  }
  if (qualification && qualification !== "all") {
    filter["eligibility.minimumEducation"] = qualification;
  }
  if (level && level !== "all") {
    filter.level = level;
  }
  if (state && state !== "all") {
    filter.stateName = new RegExp(escapeRegex(state.trim()), "i");
  }
  if (stage && stage !== "all") {
    filter.educationStages = normalizeEducationStage(stage);
  }
  if (minPay && Number(minPay) > 0) {
    filter["salary.basicPay"] = { $gte: Number(minPay) };
  }
  if (search && search.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [
      { title: re },
      { department: re },
      { ministry: re },
      { "examination.examName": re },
      { overview: re },
    ];
  }

  const jobs = await GovernmentJob.find(filter)
    .select("title slug category subCategory level department group gazettedStatus eligibility salary examination educationStages popularityScore verification")
    .sort({ popularityScore: -1, "salary.basicPay": -1 })
    .lean();

  res.status(200).json(new ApiResponse(200, jobs, `Fetched ${jobs.length} government career paths`));
});

/**
 * GET /api/government-careers/jobs/:slug
 */
export const getGovernmentJobBySlug = asyncHandler(async (req, res) => {
  await ensureGovernmentDataSeeded();
  const { slug } = req.params;

  const job = await GovernmentJob.findOne({ slug, isActive: true }).lean();
  if (!job) {
    throw ApiError.notFound("Government job profile not found");
  }

  // Also fetch any active notifications related to this role
  const relatedNotifications = await GovernmentNotification.find({
    $or: [{ jobRole: job._id }, { category: job.category }, { conductingBody: job.examination.conductingBody }],
    isActive: true,
  })
    .sort({ "importantDates.examDate": -1 })
    .limit(3)
    .lean();

  res.status(200).json(
    new ApiResponse(200, { job, relatedNotifications }, "Government job profile retrieved successfully")
  );
});

/**
 * GET /api/government-careers/exams
 * Syllabus & Examination Library
 */
export const getGovernmentExamsAndSyllabi = asyncHandler(async (req, res) => {
  await ensureGovernmentDataSeeded();
  const { conductingBody, category, search } = req.query;

  const filter = { isActive: true };
  if (conductingBody && conductingBody !== "all") {
    filter["examination.conductingBody"] = conductingBody;
  }
  if (category && category !== "all") {
    filter.category = category;
  }
  if (search && search.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ "examination.examName": re }, { title: re }, { department: re }];
  }

  const exams = await GovernmentJob.find(filter)
    .select("title slug examination syllabus department category eligibility.minimumEducation verification")
    .sort({ "examination.examName": 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, exams, "Exams and syllabus catalog fetched"));
});

/**
 * GET /api/government-careers/notifications
 * Time-aware recruitment notifications
 */
export const getGovernmentNotifications = asyncHandler(async (req, res) => {
  await ensureGovernmentDataSeeded();
  const { status, category, search } = req.query;

  const filter = { isActive: true };
  if (status && status !== "all") {
    filter.status = status;
  }
  if (category && category !== "all") {
    filter.category = category;
  }
  if (search && search.trim()) {
    const re = new RegExp(escapeRegex(search.trim()), "i");
    filter.$or = [{ title: re }, { conductingBody: re }, { eligibilitySummary: re }];
  }

  const notifications = await GovernmentNotification.find(filter)
    .populate("jobRole", "title slug salary")
    .sort({ "importantDates.applicationEndDate": -1, createdAt: -1 })
    .lean();

  res.status(200).json(new ApiResponse(200, notifications, "Recruitment notifications retrieved"));
});

/**
 * POST /api/government-careers/compare
 * Side-by-side comparison of 2 to 5 government roles
 */
export const compareGovernmentJobs = asyncHandler(async (req, res) => {
  const { slugs } = req.body;
  if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 5) {
    throw ApiError.badRequest("Please select between 2 and 5 government career paths to compare");
  }

  const jobs = await GovernmentJob.find({ slug: { $in: slugs }, isActive: true }).lean();
  if (jobs.length < 2) {
    throw ApiError.badRequest("At least 2 valid government roles must be selected");
  }

  // Optional AI analysis summarizing trade-offs without making fake guarantees
  let aiComparativeAnalysis = "";
  try {
    const prompt = `Compare these government career paths objectively for an Indian student:\n` +
      jobs.map((j) => `- ${j.title} (${j.department}): Group: ${j.group}, Basic Pay: ₹${j.salary.basicPay}, Stages: ${j.examination.selectionStages.length}, Min Education: ${j.eligibility.minimumEducation}`).join("\n") +
      `\nProvide an objective side-by-side comparison of work-life balance, posting flexibility, preparation timeline, and career progression. Do not promise selection or guarantee placement.`;

    aiComparativeAnalysis = await chatCompletion(
      [
        { role: "system", content: "You are Preyeahh's Government Career Intelligence specialist. Never fabricate selection probabilities or guarantee vacancies." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.35, maxTokens: 800 }
    );
  } catch (err) {
    aiComparativeAnalysis = "Comparative metrics compiled below. Examine pay scales, eligibility age criteria, and examination stages.";
  }

  res.status(200).json(
    new ApiResponse(200, { jobs, aiAnalysis: aiComparativeAnalysis }, "Government careers compared successfully")
  );
});

/**
 * POST /api/government-careers/add-to-planner
 * Connects a selected government exam to the student's Personal Career Planner
 */
export const addGovernmentExamToPlanner = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { jobSlug, targetExamDate } = req.body;

  if (!jobSlug) throw ApiError.badRequest("Government job slug is required");

  const job = await GovernmentJob.findOne({ slug: jobSlug, isActive: true });
  if (!job) throw ApiError.notFound("Government job role not found");

  let plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) {
    plan = await PersonalCareerPlan.create({
      student: studentId,
      primaryCareer: job.title,
      goals: [],
      milestones: [],
      tasks: [],
      deadlines: [],
    });
  }

  // 1. Add Exam Goal if not present
  const existingGoal = plan.goals.find((g) => g.title === job.title);
  if (!existingGoal) {
    plan.goals.push({
      title: job.title,
      goalType: "Primary",
      description: `Targeting ${job.examination.examName} conducted by ${job.examination.conductingBody}`,
      targetTimeline: "1-2 years",
      status: "Active",
    });
    plan.primaryCareer = job.title;
  }

  const canonicalGoal = await StudentGoal.findOne({
    student: studentId,
    goalTitle: job.title,
    status: "ACTIVE",
  });
  if (canonicalGoal) {
    canonicalGoal.type = "PRIMARY";
    await canonicalGoal.save();
  } else {
    await StudentGoal.create({
      student: studentId,
      goalTitle: job.title,
      type: "PRIMARY",
      status: "ACTIVE",
    });
  }

  // 2. Add Milestones tailored to the exam stages
  const milestonesToAdd = [
    { title: `${job.examination.examName} - Syllabus Foundation & Core Study`, timeHorizon: "3 Months", description: "Complete primary subject syllabus and high-weightage topics." },
    { title: `${job.examination.examName} - Mock Exams & Previous Years Papers`, timeHorizon: "6 Months", description: "Practice previous 10 years papers with time-bound accuracy." },
    { title: `${job.examination.examName} - Selection Stage 1 (Prelims)`, timeHorizon: "1 Year", description: "Appear in the preliminary competitive screening examination." },
  ];

  milestonesToAdd.forEach((m) => {
    if (!plan.milestones.some((pm) => pm.title === m.title)) {
      plan.milestones.push(m);
    }
  });

  // 3. Add Exam Deadline if target date provided
  if (targetExamDate) {
    plan.deadlines.push({
      title: `${job.examination.examName} Examination`,
      category: "Competitive Exam",
      date: new Date(targetExamDate),
      priority: "Critical",
      notes: `Conducted by ${job.examination.conductingBody} for ${job.title}`,
    });
  }

  await plan.save();

  res.status(200).json(
    new ApiResponse(200, { plan, addedJob: job.title }, `${job.title} and syllabus pathway integrated into Personal Career Planner!`)
  );
});
