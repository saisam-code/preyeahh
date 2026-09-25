import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // ─── IDENTITY ────────────────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    firstName: String,
    lastName: String,
    avatarUrl: String,

    // ─── AUTH ────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["student", "guide", "admin"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },

    // ─── CAREER PROFILE ──────────────────────────────────────
    branch: {
      type: String,
      enum: [
        "CSE",
        "ECE",
        "MECH",
        "CIVIL",
        "CHEM",
        "BIO",
        "AERO",
        "MINING",
        "POWER",
      ],
      default: null,
    },
    careerRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerRole",
      default: null,
    },

    // ─── AI LEARNING PROFILE ────────────────────────────────
    preferences: {
      skills: [String],
      experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
      },
      learningStyle: String,
      aiProfileSummary: String,
    },

    // ─── GUIDANCE PROGRESS ───────────────────────────────────
    guidanceProgress: [
      {
        roleId: mongoose.Schema.Types.ObjectId,
        milestoneId: mongoose.Schema.Types.ObjectId,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      },
    ],

    // ─── GUIDE PROFILE (if role === "guide") ───────────────
    guideStatus: {
      type: String,
      enum: ["available", "busy", "inactive"],
      default: "available",
    },
    guideBio: String,
    roleNames: [String], // Roles this guide can mentor
    rating: { type: Number, default: 0 },
    studentsHelped: { type: Number, default: 0 },

    // ─── SOCIAL/PROFILE ─────────────────────────────────────
    googleId: { type: String, select: false },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// PRE-SAVE: Hash password if modified
// ─────────────────────────────────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// METHODS
// ─────────────────────────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (rawPassword) {
  return bcrypt.compare(rawPassword, this.password);
};

// FIX: was `const crypto = await import("crypto")` inside a non-async
// function — SyntaxError at module load. crypto is now imported at top.
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationTokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  return rawToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15min
  return rawToken;
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationTokenHash;
  delete obj.emailVerificationExpires;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpires;
  delete obj.googleId;
  delete obj.refreshTokenVersion;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// JSON TRANSFORM: Auto-strip sensitive fields
// ─────────────────────────────────────────────────────────────────────────────

userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpires;
    delete ret.googleId;
    delete ret.refreshTokenVersion;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
