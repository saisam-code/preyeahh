const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const GUIDE_EMAIL_REGEX = /^[^\s@]+@nbkrist\.org$/i;

const guideSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => GUIDE_EMAIL_REGEX.test(v),
        message: "Guides must register with a @nbkrist.org email",
      },
    },
    password: { type: String, required: [true, "Password is required"], minlength: 6, select: false },
    branch: { type: String, required: [true, "Branch is required"], uppercase: true, trim: true, index: true },
    roleNames: { type: [String], default: [] },
    bio: { type: String, default: "", trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: { values: ["pending", "approved", "rejected"], message: "Invalid status" },
      default: "pending",
      index: true,
    },
    refreshTokenVersion: { type: Number, default: 0, select: false },
    isVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

guideSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

guideSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

guideSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return rawToken;
};

guideSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  return rawToken;
};

guideSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    branch: this.branch,
    roleNames: this.roleNames,
    bio: this.bio,
    status: this.status,
    role: "guide",
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("Guide", guideSchema);