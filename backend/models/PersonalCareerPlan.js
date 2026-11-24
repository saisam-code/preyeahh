import mongoose from "mongoose";
import { EDUCATION_STAGES, TASK_STATUSES, TASK_CATEGORIES, normalizeEducationStage } from "../constants/educationStages.js";

const plannerTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: TASK_CATEGORIES,
      default: "Academic study",
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "Not Started",
    },
    careerRelevance: { type: String, default: "" },
    scheduledDate: { type: String, required: true }, // Format: YYYY-MM-DD
    startTime: { type: String, default: "" },         // e.g. "07:00"
    endTime: { type: String, default: "" },           // e.g. "07:45"
    durationMinutes: { type: Number, default: 45 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    relatedCareerGoal: { type: String, default: "" },
    relatedSkill: { type: String, default: "" },
    relatedProject: { type: String, default: "" },
    relatedMilestoneId: { type: String, default: null },
    relatedExperimentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentExperiment", default: null, index: true },
    isRescheduled: { type: Boolean, default: false },
    aiGenerated: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const plannerMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    timeHorizon: {
      type: String,
      enum: ["Next Milestone", "3 Months", "6 Months", "1 Year", "3 Years", "Long-term Target"],
      default: "Next Milestone",
    },
    targetDate: { type: Date, default: null },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    relatedSkills: { type: [String], default: [] },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const plannerGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    goalType: {
      type: String,
      enum: ["Primary", "Alternative", "Exploring", "Temporary", "Long-term"],
      default: "Primary",
    },
    description: { type: String, default: "" },
    targetTimeline: { type: String, default: "4 years" },
    requiredSkills: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Active", "Paused", "Archived"],
      default: "Active",
    },
    progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

const plannerExamDeadlineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["University Exam", "Entrance Exam", "Competitive Exam", "Certification", "Assignment", "Scholarship", "Internship Deadline"],
      default: "University Exam",
    },
    date: { type: Date, required: true },
    priority: { type: String, enum: ["Critical", "High", "Medium", "Low"], default: "High" },
    notes: { type: String, default: "" },
    preparationTasksCreated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const plannerReviewSchema = new mongoose.Schema(
  {
    periodType: { type: String, enum: ["Weekly", "Monthly"], default: "Weekly" },
    periodDate: { type: Date, default: Date.now },
    tasksCompleted: { type: Number, default: 0 },
    tasksPostponed: { type: Number, default: 0 },
    learningHours: { type: Number, default: 0 },
    reflectionNotes: { type: String, default: "" },
    aiFeedback: { type: String, default: "" },
  },
  { timestamps: true }
);

const personalCareerPlanSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
      index: true,
    },
    primaryCareer: { type: String, default: "" },
    alternativeCareer: { type: String, default: "" },
    exploringCareers: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["Active", "Paused", "Archived"],
      default: "Active",
    },
    weeklyHoursAvailable: { type: Number, default: 14 },
    preferredWorkingHours: { type: String, default: "Evening (18:00 - 21:00)" },
    academicStage: {
      type: String,
      enum: EDUCATION_STAGES,
      set: (v) => normalizeEducationStage(v),
      default: "Undergraduate",
    },
    goals: [plannerGoalSchema],
    milestones: [plannerMilestoneSchema],
    tasks: [plannerTaskSchema],
    deadlines: [plannerExamDeadlineSchema],
    reviews: [plannerReviewSchema],
    lastAiScheduleGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

personalCareerPlanSchema.index({ "tasks.scheduledDate": 1 });

export default mongoose.model("PersonalCareerPlan", personalCareerPlanSchema);
