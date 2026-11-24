import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import Student from "../models/Student.js";
import StudentGoal from "../models/StudentGoal.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { chatCompletion } from "../services/groqService.js";

/**
 * GET /api/planner
 */
export const getStudentPlan = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  let plan = await PersonalCareerPlan.findOne({ student: studentId });

  if (!plan) {
    const student = await Student.findById(studentId);
    const primary = student?.preferences?.targetRole || student?.preferences?.primaryCareerGoal || "";
    const alt = student?.preferences?.alternativeCareerGoal || "";

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

  res.status(200).json(new ApiResponse(200, plan, "Personal Career Plan fetched"));
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

  let plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) {
    plan = await PersonalCareerPlan.create({ student: studentId, tasks: [] });
  }

  const newTask = {
    title: title.trim(),
    description: description || "",
    category: category || "Academic study",
    priority: priority || "Medium",
    careerRelevance: careerRelevance || "",
    scheduledDate,
    startTime: startTime || "",
    endTime: endTime || "",
    durationMinutes: Number(durationMinutes) || 45,
    relatedCareerGoal: relatedCareerGoal || plan.primaryCareer || "",
    relatedSkill: relatedSkill || "",
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

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) throw ApiError.notFound("Plan not found");

  const task = plan.tasks.id(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  task.isCompleted = !task.isCompleted;
  task.status = task.isCompleted ? "Completed" : "In Progress";
  task.completedAt = task.isCompleted ? new Date() : null;
  await plan.save();

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

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) throw ApiError.notFound("Plan not found");

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

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) throw ApiError.notFound("Plan not found");

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

  const plan = await PersonalCareerPlan.findOne({ student: req.user.id });
  if (!plan) throw ApiError.notFound("Plan not found");

  if (goalType === "Primary") {
    plan.primaryCareer = title.trim();
  } else if (goalType === "Alternative") {
    plan.alternativeCareer = title.trim();
  }

  plan.goals.push({
    title: title.trim(),
    goalType: goalType || "Alternative",
    description: description || "",
    targetTimeline: targetTimeline || "3 years",
    status: "Active",
  });

  await plan.save();

  const canonicalType = {
    Primary: "PRIMARY",
    Alternative: "ALTERNATIVE",
    Exploring: "EXPLORING",
  }[goalType] || "EXPLORING";
  const existing = await StudentGoal.findOne({
    student: req.user.id,
    goalTitle: title.trim(),
    status: "ACTIVE",
  });
  if (existing) {
    existing.type = canonicalType;
    await existing.save();
  } else {
    await StudentGoal.create({
      student: req.user.id,
      goalTitle: title.trim(),
      type: canonicalType,
      status: "ACTIVE",
    });
  }
  res.status(201).json(new ApiResponse(201, plan.goals[plan.goals.length - 1], "Career goal added"));
});

/**
 * POST /api/planner/deadlines
 */
export const addExamDeadline = asyncHandler(async (req, res) => {
  const { title, category, date, priority, notes } = req.body;
  if (!title || !date) throw ApiError.badRequest("Title and date are required");

  const plan = await PersonalCareerPlan.findOne({ student: req.user.id });
  if (!plan) throw ApiError.notFound("Plan not found");

  plan.deadlines.push({
    title: title.trim(),
    category: category || "University Exam",
    date: new Date(date),
    priority: priority || "High",
    notes: notes || "",
  });

  await plan.save();
  res.status(201).json(new ApiResponse(201, plan.deadlines[plan.deadlines.length - 1], "Deadline registered"));
});

/**
 * POST /api/planner/reviews
 */
export const submitReview = asyncHandler(async (req, res) => {
  const { periodType, tasksCompleted, tasksPostponed, learningHours, reflectionNotes } = req.body;

  const plan = await PersonalCareerPlan.findOne({ student: req.user.id });
  if (!plan) throw ApiError.notFound("Plan not found");

  const review = {
    periodType: periodType || "Weekly",
    periodDate: new Date(),
    tasksCompleted: Number(tasksCompleted) || 0,
    tasksPostponed: Number(tasksPostponed) || 0,
    learningHours: Number(learningHours) || 0,
    reflectionNotes: reflectionNotes || "",
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

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) throw ApiError.notFound("Personal career plan not found. Please initialize plan first.");
  const student = await Student.findById(studentId);

  const careerGoal = plan.primaryCareer || student?.preferences?.targetRole || "General career development";

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
Available daily hours: ${Math.min(Math.max(Number(availableHoursPerDay) || 2, 1), 8)} hrs/day.
Deadlines: ${deadlineContext}
Student constraints: "${constraints || "Standard daily study routine"}".

Categories MUST be one of: "Academic study", "Skill development", "Career research", "Career experiment", "Practical project", "Exam preparation", "Rest and breaks".
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

    const jsonMatch = rawAi.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid format received from AI");
    const scheduleItems = JSON.parse(jsonMatch[0]);

    const ALLOWED_CATEGORIES = new Set([
      "Academic study",
      "Skill development",
      "Career research",
      "Career experiment",
      "Practical project",
      "Exam preparation",
      "Rest and breaks",
    ]);
    const ALLOWED_PRIORITIES = new Set(["Critical", "High", "Medium", "Low"]);

    // Calculate dates in user's timezone (default IST)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" });
    const todayStr = formatter.format(now); // YYYY-MM-DD

    const dateList = [];
    const baseDate = new Date(`${todayStr}T00:00:00Z`);
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setUTCDate(baseDate.getUTCDate() + i);
      dateList.push(d.toISOString().slice(0, 10));
    }

    const maxDailyMinutes = (Number(availableHoursPerDay) || 2) * 60;
    const dailyMinutesAccumulator = {};

    const newTasks = [];
    for (const item of scheduleItems.slice(0, 14)) {
      const offset = Math.min(Math.max(Number(item.dayOffset) || 0, 0), 6);
      const scheduledDate = dateList[offset];

      const duration = Math.min(Math.max(Number(item.durationMinutes) || 45, 15), 180);
      const currentDayTotal = dailyMinutesAccumulator[scheduledDate] || 0;
      if (currentDayTotal + duration > maxDailyMinutes * 1.25) {
        continue; // Prevent overloading the day past 125% of allocated hours
      }
      dailyMinutesAccumulator[scheduledDate] = currentDayTotal + duration;

      const category = ALLOWED_CATEGORIES.has(item.category) ? item.category : "Skill development";
      const priority = ALLOWED_PRIORITIES.has(item.priority) ? item.priority : "Medium";
      const startTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) ? item.startTime : "18:00";
      const endTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(item.endTime) ? item.endTime : "18:45";

      newTasks.push({
        title: String(item.title || "Career Preparation Session").slice(0, 120),
        description: `Career activity aligned with ${careerGoal}`,
        category,
        priority,
        careerRelevance: item.careerRelevance || `Builds competence in ${careerGoal}`,
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
    throw ApiError.internal(`Could not generate adaptive schedule: ${err.message}`);
  }
});
