import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import Student from "../models/Student.js";
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

    plan = await PersonalCareerPlan.create({
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
    });
  }

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
    status: "Planned",
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
  const { constraints = "", availableHoursPerDay = 2 } = req.body;

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  const student = await Student.findById(studentId);

  const careerGoal = plan?.primaryCareer || student?.preferences?.targetRole || "General career development";
  const prompt = `Generate a 7-day balanced career plan for a student pursuing: "${careerGoal}".
Academic stage: ${plan?.academicStage || "College/School"}.
Available daily hours: ${availableHoursPerDay} hrs.
Student constraints: "${constraints || "Evening study routine"}".
Format strictly as a valid JSON array:
[{"title":"...", "category":"Academic study|Skill development|Career research|Career experiment|Practical project|Exam preparation|Rest and breaks", "priority":"High|Medium|Low", "durationMinutes":45, "dayOffset":0, "startTime":"18:00", "endTime":"18:45", "careerRelevance":"..."}]
dayOffset is 0 to 6.`;

  try {
    const rawAi = await chatCompletion(
      [
        { role: "system", content: "You are Preyeahh's Personal Career Planner AI. Return strictly valid JSON array." },
        { role: "user", content: prompt },
      ],
      { temperature: 0.3, maxTokens: 1200 },
    );

    const jsonMatch = rawAi.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Invalid format from AI");
    const scheduleItems = JSON.parse(jsonMatch[0]);

    const today = new Date();
    const newTasks = scheduleItems.map((item) => {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + (Number(item.dayOffset) || 0));
      const yyyy = taskDate.getFullYear();
      const mm = String(taskDate.getMonth() + 1).padStart(2, "0");
      const dd = String(taskDate.getDate()).padStart(2, "0");

      return {
        title: item.title,
        description: `Career activity aligned with ${careerGoal}`,
        category: item.category || "Skill development",
        priority: item.priority || "Medium",
        careerRelevance: item.careerRelevance || `Builds competence in ${careerGoal}`,
        scheduledDate: `${yyyy}-${mm}-${dd}`,
        startTime: item.startTime || "18:00",
        endTime: item.endTime || "18:45",
        durationMinutes: Number(item.durationMinutes) || 45,
        isCompleted: false,
        aiGenerated: true,
      };
    });

    plan.tasks.push(...newTasks);
    plan.lastAiScheduleGeneratedAt = new Date();
    await plan.save();

    res.status(200).json(new ApiResponse(200, { addedCount: newTasks.length, plan }, "AI Schedule generated"));
  } catch (err) {
    throw ApiError.internal(`Could not generate adaptive schedule: ${err.message}`);
  }
});
