import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// SOURCE:
//   Base    → preyeahouter/backend/models/User.js   (App A — ESM, Mongoose 9)
//   Extended→ preyeah-main/server/models/Student.js  (App B — fields)
//             preyeah-main/server/models/Guide.js    (App B — guide fields)
//             preyeah-main/server/models/Admin.js    (App B — admin fields)
//
// WHAT CHANGED VS APP A:
//   + import bcrypt, crypto
//   + password: select:false
//   + googleId: select:false
//   + branch, role, isVerified
//   + emailVerificationTokenHash/Expires  (select:false)
//   + passwordResetTokenHash/Expires      (select:false)
//   + refreshTokenVersion                 (select:false)
//   + roleNames, bio, guideStatus         (guide-only, null on others)
//   + methods: comparePassword, createEmailVerificationToken,
//              createPasswordResetToken, toSafeJSON
//   + toJSON: also strips googleId + all new select:false fields
//
// WHAT IS IDENTICAL TO APP A (untouched):
//   skillSchema, preferencesSchema (entire AI learning profile),
//   email, firstName, lastName, avatarUrl, timestamps
//
// App B's Student/Guide/Admin are NOT deleted — they remain in
// preyeah-main/server/models/ until Step 4 (unified backend).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sub-schema: individual skill entry (App A — unchanged)
// ---------------------------------------------------------------------------
const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Sub-schema: AI learning preferences (App A — unchanged)
// ---------------------------------------------------------------------------
const preferencesSchema = new mongoose.Schema(
  {
    onboardingCompleted: { type: Boolean, default: false },
    onboardingSkipped: { type: Boolean, default: false },

    // Who they are
    currentRole: { type: String, default: "" },
    targetRole: { type: String, default: "" },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", ""],
      default: "",
    },

    // What they want to learn
    goals: { type: [String], default: [] },
    skills: { type: [skillSchema], default: [] },
    interests: { type: [String], default: [] },

    // How they learn
    learningStyle: {
      type: String,
      enum: ["visual", "reading", "hands-on", "mixed", ""],
      default: "",
    },
    weeklyHoursAvailable: { type: Number, default: 0 },
    preferredLanguage: { type: String, default: "" },

    // AI-generated natural language summary (injected into chat prompts)
    aiProfileSummary: { type: String, default: "" },
    lastExtractedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Canonical User schema
// Base  : App A fields (email, password, firstName, lastName, avatarUrl,
//         googleId, preferences)
// Added : App B identity fields (branch, role, isVerified, email-verification
//         tokens, password-reset tokens, refreshTokenVersion, guide fields)
// ---------------------------------------------------------------------------
const userSchema = new mongoose.Schema(
  {
    // ── Core identity (App A — unchanged) ─────────────────────────────────
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    /**
     * password is select:false so it is NEVER returned in normal queries.
     * Existing App A auth.service.js passes an already-hashed password to
     * User.create(); the pre('save') hook is intentionally omitted here —
     * it will be added in Step 2 (auth unification) once both auth paths
     * are unified under a single controller that sends the raw password.
     */
    password: {
      type: String,
      default: null,
      select: false,       // ← ADDED (was missing in App A)
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    googleId: { type: String, default: null, select: false }, // ← select:false ADDED

    // ── Rich learning preferences (App A — full AI profile, unchanged) ────
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    // ── Identity / role fields (from App B) ───────────────────────────────

    /**
     * branch — from App B Student + Guide.
     * Stored uppercase (matches App B convention).
     * null is valid for Google-OAuth users who haven't picked a branch yet.
     */
    branch: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
      default: null,
    },

    /**
     * role — replaces App B's three separate collections (Student / Guide /
     * Admin) with a single enum on one document.
     * default: 'student' keeps all existing App A users valid.
     */
    role: {
      type: String,
      enum: {
        values: ["student", "guide", "admin"],
        message: "role must be student, guide, or admin",
      },
      default: "student",
      index: true,
    },

    // ── Email verification (App B — Student + Guide) ───────────────────────
    isVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, select: false },
    emailVerificationExpires: { type: Date, default: null, select: false },

    // ── Password reset (App B — Student, Guide, Admin) ─────────────────────
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },

    // ── Refresh-token versioning (App B — all three models) ───────────────
    refreshTokenVersion: { type: Number, default: 0, select: false },

    // ── Guide-only fields (App B — Guide model) ───────────────────────────
    // Present on every document but only meaningful when role === 'guide'.
    roleNames:   { type: [String], default: [] },
    bio:         { type: String, default: "", trim: true, maxlength: 1000 },
    guideStatus: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "guideStatus must be pending, approved, or rejected",
      },
      default: null, // null = not a guide
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ---------------------------------------------------------------------------
// Instance methods (ported from App B — Student / Guide / Admin)
// ---------------------------------------------------------------------------

/**
 * comparePassword
 * Verify a plaintext candidate against the stored bcrypt hash.
 * Always call after: User.findById(id).select('+password')
 */
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * createEmailVerificationToken
 * Generates a 32-byte random token, stores its SHA-256 hash on the document
 * with a 24-hour expiry, and returns the RAW token for the verification email.
 * (From App B Student.js + Guide.js — identical implementation)
 */
userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationTokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 h
  return rawToken;
};

/**
 * createPasswordResetToken
 * Same pattern, 15-minute expiry.
 * (From App B Student.js + Guide.js + Admin.js — identical implementation)
 */
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 min
  return rawToken;
};

/**
 * toSafeJSON
 * Role-aware public representation of the user document.
 * Consolidates App A's toJSON transform + App B's per-model toSafeJSON().
 * Guide-specific fields only appear when role === 'guide'.
 */
userSchema.methods.toSafeJSON = function () {
  const base = {
    id:          this._id.toString(),
    email:       this.email,
    firstName:   this.firstName,
    lastName:    this.lastName,
    avatarUrl:   this.avatarUrl,
    role:        this.role,
    branch:      this.branch,
    isVerified:  this.isVerified,
    preferences: this.preferences,
    createdAt:   this.createdAt,
    updatedAt:   this.updatedAt,
  };

  if (this.role === "guide") {
    base.roleNames   = this.roleNames;
    base.bio         = this.bio;
    base.guideStatus = this.guideStatus;
  }

  return base;
};

// ---------------------------------------------------------------------------
// toJSON transform — fires automatically on res.json() / JSON.stringify()
// Strips ALL sensitive / internal fields from plain serialisation.
// (select:false fields never appear in ret, but we guard defensively.)
// ---------------------------------------------------------------------------
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    // App A originals
    delete ret.password;
    delete ret.googleId;
    // App B additions
    delete ret.refreshTokenVersion;
    delete ret.emailVerificationTokenHash;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetTokenHash;
    delete ret.passwordResetExpires;
    return ret;
  },
});

// ---------------------------------------------------------------------------
const User = mongoose.model("User", userSchema);

export default User;
