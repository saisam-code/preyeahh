import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Please enter a valid email address",
      },
    },
    password: { type: String, required: function() { return !this.googleId; }, minlength: 6, select: false },
    googleId: { type: String, unique: true, sparse: true },
    guideType: { type: String, enum: ["PREYEAHH", "INSTITUTION"], default: "PREYEAHH", index: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null, index: true },
    branch: { type: String, uppercase: true, trim: true, default: "", index: true },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain", default: null, index: true },
    googlePendingOnboarding: { type: Boolean, default: false },
    bio: { type: String, default: "", trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: { values: ["pending", "approved", "rejected"], message: "Invalid status" },
      default: "pending",
      index: true,
    },
    refreshTokenVersion: { type: Number, default: 0, select: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

guideSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

guideSchema.methods.comparePassword = function (candidate) {
  // Google-only guides have no password hash — return false without throwing
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

guideSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    branch: this.branch,
    domainId: this.domainId,
    bio: this.bio,
    status: this.status,
    guideType: this.guideType,
    institutionId: this.institutionId,
    role: "guide",
    isVerified: this.isVerified,
    googlePendingOnboarding: this.googlePendingOnboarding,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Guide", guideSchema);
