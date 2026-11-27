import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { EDUCATION_STAGES, normalizeEducationStage } from "../constants/educationStages.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AI learning profile. Filled by the onboarding form, by
 * POST /api/students/profile/extract (free-text -> structured), and
 * passively from chat every N messages (see profileService).
 */
const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  },
  { _id: false }
);

const preferencesSchema = new mongoose.Schema(
  {
    educationStage: {
      type: String,
      enum: [...EDUCATION_STAGES, ""],
      set: (v) => normalizeEducationStage(v),
      default: "",
    },
    academicStream: { type: String, default: "" }, // Science, Commerce, Humanities, Vocational, or a program stream
    degreeOrProgram: { type: String, default: "" },
    specialization: { type: String, default: "" },
    yearOfStudy: { type: String, default: "" },
    semester: { type: String, default: "" },
    expectedGraduationYear: { type: Number, min: 1900, max: 2200, default: null },
    schoolOrInstitution: { type: String, default: "" },
    board: { type: String, default: "" },
    subjects: { type: [String], default: [] },
    country: { type: String, default: "India" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    currentRole: { type: String, default: "", trim: true },
    targetRole: { type: String, default: "", trim: true },
    primaryCareerGoal: { type: String, default: "", trim: true },
    alternativeCareerGoal: { type: String, default: "", trim: true },
    childhoodDream: { type: String, default: "", trim: true },
    formerCareerGoal: { type: String, default: "", trim: true },
    careerSwitchReason: { type: String, default: "", trim: true },
    exploringCareers: { type: [String], default: [] },
    experienceLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    learningStyle: { type: String, enum: ["visual", "hands-on", "reading", ""], default: "" },
    budgetRange: { type: String, default: "" },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    careerPreference: {
      type: String,
      enum: ["traditional", "unconventional", "both", "unsure"],
      default: "unsure",
    },
    skills: { type: [skillSchema], default: [] },
    weeklyHoursAvailable: { type: Number, default: 0, min: 0, max: 168 },
    preferredLanguage: { type: String, default: "English", trim: true },
    aiProfileSummary: { type: String, default: "" },
    shareContactWithGuides: { type: Boolean, default: false },
    shareProfileWithGuides: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSkipped: { type: Boolean, default: false },
    onboardingStep: { type: Number, min: 1, max: 6, default: 1 },
    lastExtractedAt: { type: Date, default: null },
  },
  { _id: false }
);

const educationHistorySchema = new mongoose.Schema(
  {
    educationStage: { type: String, enum: EDUCATION_STAGES, required: true },
    schoolOrInstitution: { type: String, default: "" },
    board: { type: String, default: "" },
    academicStream: { type: String, default: "" },
    degreeOrProgram: { type: String, default: "" },
    specialization: { type: String, default: "" },
    yearOfStudy: { type: String, default: "" },
    semester: { type: String, default: "" },
    expectedGraduationYear: { type: Number, default: null },
    recordedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => EMAIL_REGEX.test(v),
        message: "Please enter a valid email address",
      },
    },
    // Optional for Google-created accounts and legacy password accounts.
    password: { type: String, minlength: 6, select: false },
    branch: { type: String, uppercase: true, trim: true, default: "", index: true },

    // DPDP Act compliance: date of birth and age category
    // TODO: Review DPDP Act parental-consent requirements with a lawyer
    dateOfBirth: { type: Date, default: null },
    ageBand: { type: String, enum: ["UNDER_18", "18_PLUS"], default: "18_PLUS", index: true },
    educationHistory: { type: [educationHistorySchema], default: [] },

    // Google OAuth identity — stable sub claim from Google's ID token
    googleId: { type: String, unique: true, sparse: true, index: true },
    // Marks a Google-created account that hasn't completed branch onboarding yet
    googlePendingOnboarding: { type: Boolean, default: false },
    parentLinkCodeHash: { type: String, default: "", select: false, index: true },
    parentLinkCodeExpiresAt: { type: Date, default: null, select: false },

    preferences: { type: preferencesSchema, default: () => ({}) },
    refreshTokenVersion: { type: Number, default: 0, select: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next(); // Google-only accounts have no password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.comparePassword = function (candidate) {
  if (!this.password) {
    // Google-only account — prevent timing-safe leak by returning false
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidate, this.password);
};

studentSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    branch: this.branch,
    preferences: this.preferences,
    role: "student",
    isVerified: this.isVerified,
    googlePendingOnboarding: this.googlePendingOnboarding || false,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Student", studentSchema);
