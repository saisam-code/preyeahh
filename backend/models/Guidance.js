const mongoose = require("mongoose");

/**
 * Mirrors: CREATE TABLE guidance (id, title, branch, icon, points text[], role_id FK nullable)
 *
 * role: null      -> branch-wide roadmap entry (shown on every role in that branch,
 *                     or every branch if branch === "All" — see openRoleDetail's
 *                     branchRoadmap filter in role-guidance.js)
 * role: ObjectId  -> roadmap specific to one role (roleRoadmap filter)
 */
const guidanceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Guidance title is required"],
      trim: true,
      maxlength: 150,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      uppercase: true,
      index: true,
      // "All" (not uppercased away) is a valid sentinel meaning global —
      // matches beyond/guidance semantics in the original schema/app.js.
      set: (v) => (v?.toUpperCase() === "ALL" ? "All" : v?.toUpperCase()),
    },
    icon: { type: String, default: "*" },
    points: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one bullet point is required",
      },
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

guidanceSchema.index({ branch: 1, role: 1 });

module.exports = mongoose.model("Guidance", guidanceSchema);
