import mongoose from "mongoose";

/**
 * StudentGoal Model (Phase 3.2)
 * The unified source of truth for student career objectives.
 * Replaces disparate sources (RoleInterest, preferences.targetRole, plan.primaryCareer, plan.goals).
 * Enforces exactly one active PRIMARY goal.
 */
const studentGoalSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },
    goalTitle: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["PRIMARY", "ALTERNATIVE", "EXPLORING", "INTEREST"],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "COMPLETED", "ABANDONED"],
      default: "ACTIVE",
      index: true,
    },
    origin: {
      type: String,
      enum: ["DISCOVERY", "CHILDHOOD_DREAM", "CURRENT_GOAL", "SWITCH_TARGET"],
      default: "DISCOVERY",
      index: true,
    },
    previousGoalTitle: { type: String, default: "", trim: true },
    changeReason: { type: String, default: "", trim: true },
    history: [
      {
        previousType: String,
        newType: String,
        reason: { type: String, default: "" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes
studentGoalSchema.index({ student: 1, type: 1, status: 1 });
studentGoalSchema.index({ student: 1, roleId: 1 });

// Pre-save hook: Enforce exactly ONE active PRIMARY goal per student
studentGoalSchema.pre("save", async function (next) {
  if (this.type === "PRIMARY" && this.status === "ACTIVE") {
    await this.constructor.updateMany(
      {
        student: this.student,
        type: "PRIMARY",
        status: "ACTIVE",
        _id: { $ne: this._id },
      },
      {
        $set: { type: "ALTERNATIVE" },
        $push: {
          history: {
            previousType: "PRIMARY",
            newType: "ALTERNATIVE",
            reason: "Superseded by new primary goal selection",
            changedAt: new Date(),
          },
        },
      }
    );
  }
  next();
});

export default mongoose.model("StudentGoal", studentGoalSchema);
