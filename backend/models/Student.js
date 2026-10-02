import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@(gmail\.com|nbkrist\.org)$/i;

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
    currentRole: { type: String, default: "", trim: true },
    targetRole: { type: String, default: "", trim: true },
    experienceLevel: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    learningStyle: { type: String, enum: ["visual", "hands-on", "reading", ""], default: "" },
    goals: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    skills: { type: [skillSchema], default: [] },
    weeklyHoursAvailable: { type: Number, default: 0, min: 0, max: 168 },
    preferredLanguage: { type: String, default: "English", trim: true },
    aiProfileSummary: { type: String, default: "" },
    shareContactWithGuides: { type: Boolean, default: false },
    shareProfileWithGuides: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSkipped: { type: Boolean, default: false },
    lastExtractedAt: { type: Date, default: null },
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
        message: "Students must register with a Gmail (@gmail.com) or college (@nbkrist.org) email",
      },
    },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    branch: { type: String, required: [true, "Branch is required"], uppercase: true, trim: true, index: true },
    preferences: { type: preferencesSchema, default: () => ({}) },
    refreshTokenVersion: { type: Number, default: 0, select: false },
    isVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

studentSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

studentSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return rawToken;
};

studentSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return rawToken;
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
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Student", studentSchema);
