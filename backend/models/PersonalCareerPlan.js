import mongoose from "mongoose";

const plannerTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: {
      type: String,
      enum: [
        "Academic study",
        "Skill development",
        "Career research",
        "Career experiment",
        "Practical project",
        "Portfolio development",
        "Exam preparation",
        "Competition preparation",
        "Internship application",
        "Scholarship application",
        "Mentorship",
        "Personal activity",
        "Rest and breaks",
      ],
      default: "Academic study",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    careerRelevance: { type: String, default: "" },
    scheduledDate: { type: String, required: true }, // Format: YYYY-MM-DD
    startTime: { type: String, default: "" }, // e.g. "07:00"
    endTime: { type: String, default: "" },   // e.g. "07:45"
    durationMinutes: { type: Number, default: 45 },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    relatedCareerId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    relatedMilestoneId: { type: String, default: null },
    isRescheduled: { type: Boolean, default: false },
    aiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const plannerMilestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
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

const personalCareerPlanSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    primaryCareer: { type: String, default: "" },
    alternativeCareer: { type: String, default: "" },
    exploringCareers: { type: [String], default: [] },
    weeklyHoursAvailable: { type: Number, default: 14 },
    dailyStudyWindows: {
      type: [
        {
          start: String,
          end: String,
          label: String,
        },
      ],
      default: [],
    },
    academicStage: {
      type: String,
      default: "Undergraduate",
    },
    upcomingExams: [
      {
        name: String,
        date: Date,
        notes: String,
      },
    ],
    milestones: [plannerMilestoneSchema],
    tasks: [plannerTaskSchema],
    lastAiScheduleGeneratedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

personalCareerPlanSchema.index({ student: 1 });
personalCareerPlanSchema.index({ "tasks.scheduledDate": 1 });

export default mongoose.model("PersonalCareerPlan", personalCareerPlanSchema);
