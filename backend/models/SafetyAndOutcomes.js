import mongoose from "mongoose";

/**
 * Trust & Safety: Moderation, Reports, and Blocking
 */
const userReportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "reporterModel" },
    reporterModel: { type: String, enum: ["Student", "Guide", "Admin", "Parent"], default: "Student" },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      enum: [
        "Inappropriate behavior",
        "False or misleading career advice",
        "Harassment",
        "Spam",
        "Fraud or fake credentials",
        "Unsafe communication",
        "Other",
      ],
      required: true,
    },
    details: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
      default: "PENDING",
      index: true,
    },
    resolutionNotes: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const userBlockSchema = new mongoose.Schema(
  {
    blocker: { type: mongoose.Schema.Types.ObjectId, required: true },
    blockedUser: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);
userBlockSchema.index({ blocker: 1, blockedUser: 1 }, { unique: true });

/**
 * Career Outcome & Alumni Milestone Tracking
 */
const careerOutcomeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    outcomeType: {
      type: String,
      enum: [
        "Higher Education Admission",
        "Employment / Job Offer",
        "Internship Completed",
        "Competition Winner",
        "Scholarship Awarded",
        "Startup / Entrepreneurship",
        "Certification Completed",
        "Career Transition Completed",
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    organizationOrInstitution: { type: String, default: "" },
    roleOrDegree: { type: String, default: "" },
    outcomeDate: { type: Date, default: Date.now },
    verificationEvidenceUrl: { type: String, default: "" },
    isPublic: { type: Boolean, default: false },
    storySummary: { type: String, default: "" },
  },
  { timestamps: true }
);

/**
 * Verified Information Review Submission
 */
const verificationSubmissionSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    submitterRole: { type: String, enum: ["guide", "admin"], default: "guide" },
    entityType: {
      type: String,
      enum: ["Career Requirement", "Salary Benchmark", "Entrance Exam", "Scholarship", "Institution Opportunity"],
      required: true,
    },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    title: { type: String, required: true },
    sourceName: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    dataPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["PENDING_REVIEW", "VERIFIED", "REJECTED", "NEEDS_UPDATE"],
      default: "PENDING_REVIEW",
      index: true,
    },
    reviewNotes: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

export const UserReport = mongoose.model("UserReport", userReportSchema);
export const UserBlock = mongoose.model("UserBlock", userBlockSchema);
export const CareerOutcome = mongoose.model("CareerOutcome", careerOutcomeSchema);
export const VerificationSubmission = mongoose.model("VerificationSubmission", verificationSubmissionSchema);
