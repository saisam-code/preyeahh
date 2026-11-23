import mongoose from "mongoose";

/**
 * Verification metadata schema for real-world verified facts
 * (salaries, eligibility, exams, opportunities, institutions)
 */
export const verificationMetadataSchema = new mongoose.Schema(
  {
    sourceName: { type: String, default: "", trim: true },
    sourceUrl: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["VERIFIED", "PENDING_VERIFICATION", "NEEDS_UPDATE", "UNVERIFIED"],
      default: "UNVERIFIED",
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    verifiedAt: { type: Date, default: null },
    lastUpdatedDate: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Career Reality and Financial Planning Schema
 */
export const careerRealitySchema = new mongoose.Schema(
  {
    salaryRange: {
      starting: { type: String, default: "₹3.5 LPA - ₹6 LPA" },
      mid: { type: String, default: "₹8 LPA - ₹15 LPA" },
      experienced: { type: String, default: "₹20 LPA - ₹40+ LPA" },
      currency: { type: String, default: "INR" },
    },
    demandLevel: {
      type: String,
      enum: ["Very High", "High", "Moderate", "Emerging", "Niche"],
      default: "High",
    },
    competitionLevel: {
      type: String,
      enum: ["Very High", "High", "Moderate", "Low"],
      default: "High",
    },
    costs: {
      educationEstimatedMin: { type: Number, default: 0 },
      educationEstimatedMax: { type: Number, default: 0 },
      trainingOrCertificationsMin: { type: Number, default: 0 },
      trainingOrCertificationsMax: { type: Number, default: 0 },
      equipmentOrToolsMin: { type: Number, default: 0 },
      equipmentOrToolsMax: { type: Number, default: 0 },
      examFeesMin: { type: Number, default: 0 },
      examFeesMax: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
    },
    timeToEmployabilityMonths: { type: Number, default: 48 },
    employmentTypes: {
      type: [String],
      default: ["Full-time Employment", "Freelance / Independent"],
    },
    industryConditions: { type: String, default: "" },
    careerRisks: { type: [String], default: [] },
    growthOpportunities: { type: [String], default: [] },
    geographicHubs: { type: [String], default: [] },
    dayToDayReality: { type: String, default: "" },
    verification: { type: verificationMetadataSchema, default: () => ({ status: "UNVERIFIED" }) },
  },
  { _id: false }
);

/**
 * Career Experiment Template Schema
 */
export const careerExperimentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    objective: { type: String, required: true },
    durationDays: { type: Number, default: 7 },
    estimatedHours: { type: Number, default: 10 },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    approximateCost: { type: Number, default: 0 },
    requiredResources: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    expectedOutput: { type: String, default: "" },
    skillsDeveloped: { type: [String], default: [] },
  },
  { _id: true }
);
