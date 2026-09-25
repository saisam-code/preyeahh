import mongoose from "mongoose";

const userGuidanceProgressSchema = new mongoose.Schema(
  {
    // ─── REFERENCE ──────────────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerRole",
      required: true,
    },

    // ─── MILESTONE TRACKING ─────────────────────────────────
    // Only tracks milestones with status: "available"
    milestones: [
      {
        milestoneId: mongoose.Schema.Types.ObjectId,
        title: String,
        description: String,
        status: {
          type: String,
          enum: ["available", "in_progress", "completed"],
          default: "available",
        },
        completedAt: Date,
        completionPercentage: { type: Number, default: 0 }, // 0-100
        notes: String,
      },
    ],

    // ─── OVERALL PROGRESS ───────────────────────────────────
    totalMilestones: Number,
    completedMilestones: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0 }, // 0-100

    // ─── TIMELINE ────────────────────────────────────────────
    startedAt: { type: Date, default: Date.now },
    completedAt: Date,
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// METHODS
// ─────────────────────────────────────────────────────────────────────────────

userGuidanceProgressSchema.methods.updateMilestoneStatus = async function (
  milestoneId,
  newStatus
) {
  const milestone = this.milestones.find(
    (m) => m.milestoneId.toString() === milestoneId.toString()
  );

  if (!milestone) {
    throw new Error("Milestone not found");
  }

  milestone.status = newStatus;
  milestone.completedAt = newStatus === "completed" ? new Date() : null;

  // Recalculate progress
  this.completedMilestones = this.milestones.filter(
    (m) => m.status === "completed"
  ).length;
  this.progressPercentage = Math.round(
    (this.completedMilestones / this.totalMilestones) * 100
  );

  this.lastUpdatedAt = new Date();

  return this.save();
};

userGuidanceProgressSchema.methods.isCompleted = function () {
  return this.progressPercentage === 100;
};

// ─────────────────────────────────────────────────────────────────────────────
// INDEX
// ─────────────────────────────────────────────────────────────────────────────

userGuidanceProgressSchema.index({ userId: 1, roleId: 1 }, { unique: true });

export default mongoose.model("UserGuidanceProgress", userGuidanceProgressSchema);
