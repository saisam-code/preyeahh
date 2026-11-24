import mongoose from "mongoose";
import { verificationMetadataSchema } from "./CareerIntelligence.js";
import { normalizeEducationStages } from "../constants/educationStages.js";

/**
 * Student Career Experiment Attempt
 */
const studentExperimentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    plannerTaskId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    experimentTitle: { type: String, required: true },
    careerDomain: { type: String, default: "" },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    evidenceUrl: { type: String, default: "" },
    reflectionNotes: { type: String, default: "" },
    skillsGained: { type: [String], default: [] },
    rating: { type: Number, min: 1, max: 5, default: null },
  },
  { timestamps: true }
);

/**
 * Student Practical Project / Portfolio Entry
 */
const studentProjectSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    careerRelevance: { type: String, default: "" },
    skillsUsed: { type: [String], default: [] },
    projectType: {
      type: String,
      enum: ["Personal", "Academic", "Career Experiment", "Technical", "Creative", "Competition", "Internship"],
      default: "Personal",
    },
    liveUrl: { type: String, default: "" },
    repoUrl: { type: String, default: "" },
    evidenceFiles: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "completed",
    },
    isPublicOnPortfolio: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

/**
 * Verified Real-World Opportunity (Scholarships, Competitions, Internships, Exams)
 */
const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "Scholarship",
        "Competition",
        "Olympiad",
        "Internship",
        "Fellowship",
        "Entrance Exam",
        "Workshop",
        "Higher Education",
      ],
      required: true,
      index: true,
    },
    description: { type: String, required: true },
    eligibility: { type: String, default: "" },
    educationLevels: {
      type: [String],
      default: ["Undergraduate"], // e.g. Class 6-8, Class 9-10, Class 11-12, Undergraduate, Postgraduate, PhD
      set: normalizeEducationStages,
    },
    domainsOrBranches: { type: [String], default: ["ALL"] },
    location: { type: String, default: "India / Online" },
    costOrStipend: { type: String, default: "Free" },
    deadline: { type: Date, default: null },
    officialUrl: { type: String, default: "" },
    verification: { type: verificationMetadataSchema, default: () => ({ status: "UNVERIFIED" }) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Saved Career Comparisons
 */
const careerComparisonSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    title: { type: String, default: "Career Comparison" },
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    aiAnalysis: { type: String, default: "" },
  },
  { timestamps: true }
);

export const StudentExperiment = mongoose.model("StudentExperiment", studentExperimentSchema);
export const StudentProject = mongoose.model("StudentProject", studentProjectSchema);
export const Opportunity = mongoose.model("Opportunity", opportunitySchema);
export const CareerComparison = mongoose.model("CareerComparison", careerComparisonSchema);
