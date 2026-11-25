import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import Student from "../models/Student.js";
import StudentGoal from "../models/StudentGoal.js";
import { StudentExperiment, StudentProject } from "../models/StudentDevelopment.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatCompletion } from "../services/groqService.js";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "../constants/educationStages.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const GOAL_TYPES = new Set(["Primary", "Alternative", "Exploring", "Temporary", "Long-term"]);
const ALLOWED_CATEGORIES = new Set(TASK_CATEGORIES);
const ALLOWED_PRIORITIES = new Set(TASK_PRIORITIES);

const clamp = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
};

const isValidDateString = (value) => {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

const findOrCreatePlan = async (studentId) =>
  await PersonalCareerPlan.findOneAndUpdate(
    { student: studentId },
    { $setOnInsert: { student: studentId, tasks: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

const findPlanForStudent = async (studentId) => {
  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) throw ApiError.notFound("Plan not found");
  return plan;
};

const normalizeCanonicalGoalType = (goalType) =>
  ({
    Primary: "PRIMARY",
    Alternative: "ALTERNATIVE",
    Exploring: "EXPLORING",
    Temporary: "EXPLORING",
    "Long-term": "EXPLORING",
  }[goalType] || null);

const parseScheduleArray = (raw) => {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
};

const getDateList = (timezone) => {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    throw ApiError.badRequest("timezone must be a valid IANA timezone");
  }
  const todayStr = formatter.format(new Date());
  if (!isValidDateString(todayStr)) throw ApiError.badRequest("Could not calculate dates for timezone");
  const baseDate = new Date(`${todayStr}T00:00:00Z`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseDate);
    date.setUTCDate(baseDate.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
};

/**
 * GET /api/planner
 */
export const getStudentPlan = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  let plan = await PersonalCareerPlan.findOne({ student: studentId });

  if (!plan) {
    const student = await Student.findById(studentId);
    const canonicalGoals = await StudentGoal.find({ student: studentId, status: "ACTIVE" })
      .sort({ type: 1, updatedAt: -1 })
      .lean();
    const primary = canonicalGoals.find((goal) => goal.type === "PRIMARY")?.goalTitle ||
      student?.preferences?.targetRole ||
      student?.preferences?.primaryCareerGoal ||
      "";
    const alt = canonicalGoals.find((goal) => goal.type === "ALTERNATIVE")?.goalTitle ||
      student?.preferences?.alternativeCareerGoal ||
      "";

    plan = await PersonalCareerPlan.findOneAndUpdate(
      { student: studentId },
      {
        $setOnInsert: {
          student: studentId,
          primaryCareer: primary,
          alternativeCareer: alt,
          weeklyHoursAvailable: student?.preferences?.weeklyHoursAvailable || 14,
          academicStage: student?.preferences?.educationStage || "Undergraduate",
          goals: [
            ...(primary ? [{ title: primary, goalType: "Primary", description: `Primary career target in ${primary}` }] : []),
            ...(alt ? [{ title: alt, goalType: "Alternative", description: `Alternative pathway in ${alt}` }] : []),
          ],
          milestones: [
            { title: "Core Fundamentals Mastery", timeHorizon: "Next Milestone", description: "Learn fundamentals and foundational concepts." },
            { title: "First Practical Career Experiment", timeHorizon: "3 Months", description: "Build a small end-to-end prototype." },
            { title: "Intermediate Skills & Portfolio Project", timeHorizon: "6 Months", description: "Demonstrate verified competence through practical projects." },
            { title: "Target Internships & Competitions", timeHorizon: "1 Year", description: "Participate in real-world professional opportunities." },
            { title: "Professional Readiness & Outcome", timeHorizon: "3 Years", description: "Attain high-impact employability and career outcome." },
          ],
          tasks: [],
          deadlines: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  const canonicalGoals = await StudentGoal.find({ student: studentId, status: "ACTIVE" })
    .sort({ type: 1, updatedAt: -1 })
    .lean();
  const primary = canonicalGoals.find((goal) => goal.type === "PRIMARY");
  const alternative = canonicalGoals.find((goal) => goal.type === "ALTERNATIVE");
  if (primary) plan.primaryCareer = primary.goalTitle;
  if (alternative) plan.alternativeCareer = alternative.goalTitle;

  const canonicalGoalTypeMap = {
    PRIMARY: "Primary",
    ALTERNATIVE: "Alternative",
    EXPLORING: "Exploring",
    INTEREST: "Exploring",
  };
  for (const goal of canonicalGoals) {
    const existingGoal = plan.goals.find(
      (item) => item.title.trim().toLowerCase() === goal.goalTitle.trim().toLowerCase()
    );
    if (!existingGoal) {
      plan.goals.push({
        title: goal.goalTitle,
        goalType: canonicalGoalTypeMap[goal.type] || "Exploring",
        description: `${goal.type === "PRIMARY" ? "Primary" : "Alternative or exploration"} career direction preserved in goal history.`,
        targetTimeline: goal.type === "PRIMARY" ? "3 years" : "Explore and compare",
        status: goal.status === "ACTIVE" ? "Active" : "Archived",
        progressPercent: 0,
      });
    }
  }

  const expectedMilestones = canonicalGoals.map((goal) => ({
    key: `${goal.type}:${goal.goalTitle}`,
    milestone: {
      title: `Explore and prove readiness: ${goal.goalTitle}`,
      description: `Complete one realistic experiment, build proof of skill, and review the real requirements before committing.`,
      timeHorizon: goal.type === "PRIMARY" ? "6 Months" : "3 Months",
      relatedSkills: [],
      notes: `Synced from career goal history (${goal.type}).`,
    },
  }));
  for (const expected of expectedMilestones) {
    const alreadyLinked = plan.milestones.some(
      (milestone) => milestone.notes === expected.milestone.notes
    );
    if (!alreadyLinked) plan.milestones.push(expected.milestone);
  }
  await plan.save();

  const [projects, experiments] = await Promise.all([
    StudentProject.find({ student: studentId }).sort({ completedAt: -1 }).lean(),
    StudentExperiment.find({ student: studentId }).sort({ startedAt: -1 }).lean(),
  ]);
  const planWithProof = plan.toObject();
  planWithProof.projects = projects;
  planWithProof.experiments = experiments;

  res.status(200).json(new ApiResponse(200, planWithProof, "Personal Career Plan fetched"));
});

/**
 * POST /api/planner/tasks
 */
export const addTask = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const {
    title,
    description,
    category,
    priority,
    careerRelevance,
    scheduledDate,
    startTime,
    endTime,
    durationMinutes,
    relatedCareerGoal,
    relatedSkill,
  } = req.body;

  if (!title || !scheduledDate) {
    throw ApiError.badRequest("Task title and scheduledDate (YYYY-MM-DD) are required");
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 120) throw ApiError.badRequest("Task title must be 120 characters or fewer");
  if (!isValidDateString(scheduledDate)) throw ApiError.badRequest("scheduledDate must be a valid YYYY-MM-DD date");
  if (startTime && !TIME_PATTERN.test(startTime)) throw ApiError.badRequest("startTime must use 24-hour HH:mm format");
  if (endTime && !TIME_PATTERN.test(endTime)) throw ApiError.badRequest("endTime must use 24-hour HH:mm format");

  const plan = await findOrCreatePlan(studentId);

  const newTask = {
    title: trimmedTitle,
    description: String(description || "").slice(0, 500),
    category: ALLOWED_CATEGORIES.has(category) ? category : "Academic study",
    priority: ALLOWED_PRIORITIES.has(priority) ? priority : "Medium",
    careerRelevance: String(careerRelevance || "").slice(0, 500),
    scheduledDate,
    startTime: startTime || "",
    endTime: endTime || "",
    durationMinutes: clamp(durationMinutes, 15, 180, 45),
    relatedCareerGoal: String(relatedCareerGoal || plan.primaryCareer || "").slice(0, 120),
    relatedSkill: String(relatedSkill || "").slice(0, 120),
    isCompleted: false,
    status: "Not Started", // must match enum in PersonalCareerPlan.js
    aiGenerated: false,
  };

  plan.tasks.push(newTask);
  await plan.save();

  const savedTask = plan.tasks[plan.tasks.length - 1];
  res.status(201).json(new ApiResponse(201, savedTask, "Task added to planner"));
});

/**
 * PATCH /api/planner/tasks/:taskId/toggle
 */
export const toggleTaskCompletion = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { taskId } = req.params;
  const plan = await findPlanForStudent(studentId);

  const task = plan.tasks.id(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  task.isCompleted = !task.isCompleted;
  task.status = task.isCompleted ? "Completed" : "Not Started";
  task.completedAt = task.isCompleted ? new Date() : null;
  await plan.save();

  if (task.relatedExperimentId) {
    await StudentExperiment.updateOne(
      { _id: task.relatedExperimentId, student: studentId },
      {
        $set: task.isCompleted
          ? { status: "completed", completedAt: new Date() }
          : { status: "in_progress", completedAt: null },
      }
    );
  }

  res.status(200).json(new ApiResponse(200, task, "Task updated"));
});

/**
 * PATCH /api/planner/tasks/:taskId/reschedule
 */
export const rescheduleTask = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { taskId } = req.params;
  const { newDate, startTime, endTime } = req.body;

  if (!newDate) throw ApiError.badRequest("newDate is required");
  if (!isValidDateString(newDate)) throw ApiError.badRequest("newDate must be a valid YYYY-MM-DD date");
  if (startTime && !TIME_PATTERN.test(startTime)) throw ApiError.badRequest("startTime must use 24-hour HH:mm format");
  if (endTime && !TIME_PATTERN.test(endTime)) throw ApiError.badRequest("endTime must use 24-hour HH:mm format");

  const plan = await findPlanForStudent(studentId);

  const task = plan.tasks.id(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  task.scheduledDate = newDate;
  if (startTime) task.startTime = startTime;
  if (endTime) task.endTime = endTime;
  task.isRescheduled = true;
  task.status = "In Progress";
  await plan.save();

  res.status(200).json(new ApiResponse(200, task, "Task rescheduled successfully"));
});

/**
 * DELETE /api/planner/tasks/:taskId
 */
export const deleteTask = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { taskId } = req.params;

  const plan = await findPlanForStudent(studentId);

  const task = plan.tasks.id(taskId);
  if (!task) throw ApiError.notFound("Task not found");
  if (task.relatedExperimentId) {
    await StudentExperiment.updateOne(
      { _id: task.relatedExperimentId, student: studentId },
      { $set: { plannerTaskId: null } }
    );
  }
  plan.tasks.pull(taskId);
  await plan.save();

  res.status(200).json(new ApiResponse(200, null, "Task deleted"));
});

/**
 * POST /api/planner/goals
 */
export const addCareerGoal = asyncHandler(async (req, res) => {
  const { title, goalType, description, targetTimeline } = req.body;
  if (!title) throw ApiError.badRequest("Goal title is required");
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw ApiError.badRequest("Goal title is required");
  if (trimmedTitle.length > 120) throw ApiError.badRequest("Goal title must be 120 characters or fewer");
  if (goalType && !GOAL_TYPES.has(goalType)) throw ApiError.badRequest("Invalid career goal type");

  const plan = await findOrCreatePlan(req.user.id);
  const resolvedGoalType = goalType || "Alternative";

  if (resolvedGoalType === "Primary") {
    plan.primaryCareer = trimmedTitle;
    for (const goal of plan.goals) {
      if (goal.goalType === "Primary" && goal.title.toLowerCase() !== trimmedTitle.toLowerCase()) {
        goal.goalType = "Alternative";
      }
    }
  } else if (resolvedGoalType === "Alternative") {
    plan.alternativeCareer = trimmedTitle;
  }

  const existingPlanGoal = plan.goals.find((goal) => goal.title.toLowerCase() === trimmedTitle.toLowerCase());
  if (existingPlanGoal) {
    existingPlanGoal.goalType = resolvedGoalType;
    existingPlanGoal.description = String(description || existingPlanGoal.description || "").slice(0, 500);
    existingPlanGoal.targetTimeline = String(targetTimeline || existingPlanGoal.targetTimeline || "3 years").slice(0, 120);
  } else {
    plan.goals.push({
      title: trimmedTitle,
      goalType: resolvedGoalType,
      description: String(description || "").slice(0, 500),
      targetTimeline: String(targetTimeline || "3 years").slice(0, 120),
      status: "Active",
    });
  }

  await plan.save();

  const canonicalType = normalizeCanonicalGoalType(resolvedGoalType);
  const existing = await StudentGoal.findOne({
    student: req.user.id,
    goalTitle: trimmedTitle,
    status: "ACTIVE",
  });
  if (existing) {
    existing.type = canonicalType;
    await existing.save();
  } else {
    await StudentGoal.create({
      student: req.user.id,
      goalTitle: trimmedTitle,
      type: canonicalType,
      status: "ACTIVE",
    });
  }
  const savedGoal = plan.goals.find((goal) => goal.title.toLowerCase() === trimmedTitle.toLowerCase());
  res.status(201).json(new ApiResponse(201, savedGoal, "Career goal added"));
});

/**
 * POST /api/planner/deadlines
 */
export const addExamDeadline = asyncHandler(async (req, res) => {
  const { title, category, date, priority, notes } = req.body;
  if (!title || !date) throw ApiError.badRequest("Title and date are required");
  const trimmedTitle = title.trim();
  if (!trimmedTitle) throw ApiError.badRequest("Title is required");
  if (!isValidDateString(date)) throw ApiError.badRequest("date must be a valid YYYY-MM-DD date");

  const plan = await findPlanForStudent(req.user.id);

  plan.deadlines.push({
    title: trimmedTitle.slice(0, 120),
    category: category || "University Exam",
    date: new Date(`${date}T00:00:00.000Z`),
    priority: ALLOWED_PRIORITIES.has(priority) ? priority : "High",
    notes: String(notes || "").slice(0, 500),
  });

  await plan.save();
  res.status(201).json(new ApiResponse(201, plan.deadlines[plan.deadlines.length - 1], "Deadline registered"));
});

/**
 * POST /api/planner/reviews
 */
export const submitReview = asyncHandler(async (req, res) => {
  const { periodType, tasksCompleted, tasksPostponed, learningHours, reflectionNotes } = req.body;
  if (periodType && !["Weekly", "Monthly"].includes(periodType)) throw ApiError.badRequest("Invalid review period");

  const plan = await findPlanForStudent(req.user.id);

  const review = {
    periodType: periodType || "Weekly",
    periodDate: new Date(),
    tasksCompleted: clamp(tasksCompleted, 0, 100000, 0),
    tasksPostponed: clamp(tasksPostponed, 0, 100000, 0),
    learningHours: clamp(learningHours, 0, 10000, 0),
    reflectionNotes: String(reflectionNotes || "").slice(0, 2000),
    aiFeedback: "Keep up the steady, consistent momentum! Prioritize depth in your practical builds.",
  };

  plan.reviews.push(review);
  await plan.save();

  res.status(201).json(new ApiResponse(201, review, "Review saved"));
});

/**
 * POST /api/planner/generate-schedule
 */
export const generateAdaptiveSchedule = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { constraints = "", availableHoursPerDay = 2, timezone = "Asia/Kolkata" } = req.body;
  if (typeof constraints !== "string") throw ApiError.badRequest("constraints must be a string");
  if (constraints.length > 500) throw ApiError.badRequest("constraints must be 500 characters or fewer");

  const plan = await findPlanForStudent(studentId);
  const student = await Student.findById(studentId);

  const careerGoal = plan.primaryCareer || student?.preferences?.targetRole || "General career development";
  const dailyHours = clamp(availableHoursPerDay, 1, 8, 2);
  const dateList = getDateList(timezone || "Asia/Kolkata");

  // Check upcoming exam deadlines in the next 14 days to adapt study load
  const upcomingDeadlines = (plan.deadlines || []).filter((d) => {
    const diffDays = (new Date(d.date) - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 14;
  });

  const deadlineContext = upcomingDeadlines.length > 0
    ? `Upcoming exam/deadlines in next 14 days: ${upcomingDeadlines.map((d) => `${d.title} on ${d.date}`).join(", ")}. Dedicate at least 50% of available time to exam preparation and reduce excessive cognitive load.`
    : "No immediate exams in the next 14 days. Emphasize balanced skill acquisition and practical building.";

  const prompt = `Generate a 7-day balanced career study plan for a student pursuing: "${careerGoal}".
Academic stage: ${plan.academicStage || "Undergraduate"}.
Available daily hours: ${dailyHours} hrs/day.
Deadlines: ${deadlineContext}
Student constraints: "${constraints || "Standard daily study routine"}".

Categories MUST be one of: ${TASK_CATEGORIES.join(", ")}.
Priority MUST be one of: "Critical", "High", "Medium", "Low".
Format strictly as a valid JSON array of 7 to 14 task objects:
[{"title":"...", "category":"...", "priority":"...", "durationMinutes":45, "dayOffset":0, "startTime":"18:00", "endTime":"18:45", "careerRelevance":"..."}]
dayOffset is integer 0 to 6.`;

  try {
    const rawAi = await chatCompletion(
      [
        { role: "system", content: "You are Preyeahh's Personal Career Planner AI. Return strictly valid JSON array without markdown formatting." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.3, maxTokens: 1400 },
    );

    const scheduleItems = parseScheduleArray(rawAi);
    if (!scheduleItems) throw new ApiError(502, "AI returned invalid schedule data. Please try again.");

    const maxDailyMinutes = dailyHours * 60;
    const dailyMinutesAccumulator = {};

    const newTasks = [];
    for (const item of scheduleItems.slice(0, 14)) {
      if (!item || typeof item !== "object") continue;
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 120) : "";
      if (!title) continue;

      const offset = clamp(item.dayOffset, 0, 6, 0);
      const scheduledDate = dateList[offset];

      const duration = clamp(item.durationMinutes, 15, 180, 45);
      const currentDayTotal = dailyMinutesAccumulator[scheduledDate] || 0;
      if (currentDayTotal + duration > maxDailyMinutes) {
        continue;
      }
      dailyMinutesAccumulator[scheduledDate] = currentDayTotal + duration;

      const category = ALLOWED_CATEGORIES.has(item.category) ? item.category : "Skill development";
      const priority = ALLOWED_PRIORITIES.has(item.priority) ? item.priority : "Medium";
      const startTime = TIME_PATTERN.test(item.startTime) ? item.startTime : "18:00";
      const endTime = TIME_PATTERN.test(item.endTime) ? item.endTime : "18:45";

      newTasks.push({
        title,
        description: `Career activity aligned with ${String(careerGoal).slice(0, 120)}`,
        category,
        priority,
        careerRelevance: String(item.careerRelevance || `Builds competence in ${careerGoal}`).slice(0, 500),
        scheduledDate,
        startTime,
        endTime,
        durationMinutes: duration,
        isCompleted: false,
        status: "Not Started",
        aiGenerated: true,
      });
    }

    // Deduplicate / replace previous uncompleted AI tasks in this generated 7-day window
    const generatedDatesSet = new Set(dateList);
    plan.tasks = plan.tasks.filter((t) => !(t.aiGenerated && !t.isCompleted && generatedDatesSet.has(t.scheduledDate)));
    plan.tasks.push(...newTasks);
    plan.lastAiScheduleGeneratedAt = new Date();
    await plan.save();

    res.status(200).json(new ApiResponse(200, { addedCount: newTasks.length, plan }, "AI Schedule generated"));
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.internal("Could not generate adaptive schedule");
  }
});
