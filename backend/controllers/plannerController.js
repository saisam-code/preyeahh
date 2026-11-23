import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import Student from "../models/Student.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { callGroqChat } from "../services/groqService.js";

/**
 * GET /api/planner
 * Get the student's active personal career plan or create a baseline default if none exists
 */
export const getStudentPlan = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  let plan = await PersonalCareerPlan.findOne({ student: studentId });

  if (!plan) {
    const student = await Student.findById(studentId);
    plan = await PersonalCareerPlan.create({
      student: studentId,
      primaryCareer: student?.preferences?.targetRole || student?.preferences?.primaryCareerGoal || "Software Engineer",
      alternativeCareer: student?.preferences?.alternativeCareerGoal || "",
      exploringCareers: student?.preferences?.exploringCareers || [],
      weeklyHoursAvailable: student?.preferences?.weeklyHoursAvailable || 14,
      academicStage: student?.preferences?.educationStage || "Undergraduate",
      milestones: [
        { title: "Understand Fundamentals & Core Concepts", timeHorizon: "Next Milestone" },
        { title: "Complete First Career Experiment / Mini Project", timeHorizon: "3 Months" },
        { title: "Build Portfolio & Practice Intermediate Skills", timeHorizon: "6 Months" },
        { title: "Apply for Internships / Competitions", timeHorizon: "1 Year" },
      ],
      tasks: [],
    });
  }

  res.status(200).json(new ApiResponse(200, plan, "Personal Career Plan fetched"));
});

/**
 * POST /api/planner/tasks
 * Add a manual task to the student's personal career planner
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
    isCompleted: false,
    aiGenerated: false,
  };

  plan.tasks.push(newTask);
  await plan.save();

  const savedTask = plan.tasks[plan.tasks.length - 1];
  res.status(201).json(new ApiResponse(201, savedTask, "Task added to planner"));
});

/**
 * PATCH /api/planner/tasks/:taskId/toggle
 * Toggle completion status of a planner task
 */
export const toggleTaskCompletion = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { taskId } = req.params;

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  if (!plan) throw ApiError.notFound("Plan not found");

  const task = plan.tasks.id(taskId);
  if (!task) throw ApiError.notFound("Task not found");

  task.isCompleted = !task.isCompleted;
  task.completedAt = task.isCompleted ? new Date() : null;
  await plan.save();

  res.status(200).json(new ApiResponse(200, task, "Task updated"));
});

/**
 * PATCH /api/planner/tasks/:taskId/reschedule
 * Intelligently reschedule a task without marking as failure
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
 * POST /api/planner/generate-schedule
 * AI timetable generation connecting long-term career goal with balanced daily routine
 */
export const generateAdaptiveSchedule = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  const { constraints = "", availableHoursPerDay = 2, targetDateRange = "week" } = req.body;

  const plan = await PersonalCareerPlan.findOne({ student: studentId });
  const student = await Student.findById(studentId);

  const careerGoal = plan?.primaryCareer || student?.preferences?.targetRole || "Career Exploration";
  const prompt = `Generate a realistic 7-day balanced career action plan for a student pursuing: "${careerGoal}".
Academic stage: ${plan?.academicStage || "College/School"}.
Available daily hours for prep/skills: ${availableHoursPerDay} hrs.
Student constraints/context: "${constraints || "Standard academic routine with evening study windows"}".
Rules:
- Include academic study, skill practice, career research/experiment, and breaks.
- Never overload or burn out the student.
- Format strictly as a valid JSON array of objects with keys:
  [{"title":"...", "category":"Academic study|Skill development|Career research|Career experiment|Practical project|Exam preparation|Rest and breaks", "priority":"High|Medium|Low", "durationMinutes":45, "dayOffset":0, "startTime":"18:00", "endTime":"18:45", "careerRelevance":"..."}]
where dayOffset is 0 for today, 1 for tomorrow, up to 6.`;

  try {
    const rawAi = await callGroqChat({
      messages: [
        { role: "system", content: "You are Preyeahh's Personal Career Planner AI. Return strictly valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const jsonMatch = rawAi.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Invalid format from AI");
    }
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
