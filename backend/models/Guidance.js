import mongoose from "mongoose";
import { contentAuditFields } from "./ContentAudit.js";

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
      // NOTE: do NOT use `uppercase: true` here — it runs after the setter and
      // would turn the "All" sentinel back to "ALL", breaking branch-wide queries.
      // Normalisation is handled entirely by the setter below.
      set: (v) => {
        if (!v) return v;
        const upper = v.toUpperCase();
        // "All" is the special sentinel meaning "every branch"
        return upper === "ALL" ? "All" : upper;
      },
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
    overview: { type: String, default: "", trim: true, maxlength: 1500 },
    resources: { type: [String], default: [] },
    durationWeeks: { type: Number, min: 1, max: 52, default: 4 },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
      index: true,
    },
    ...contentAuditFields,
  },
  { timestamps: true }
);

// Compound index covers branch-only queries (prefix) and branch+role queries.
// A standalone branch index would be redundant with this prefix.
guidanceSchema.index({ branch: 1, role: 1 });

export default mongoose.model("Guidance", guidanceSchema);
