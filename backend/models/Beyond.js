import mongoose from "mongoose";
import { contentAuditFields } from "./ContentAudit.js";

/**
 * Mirrors: CREATE TABLE beyond (title, branch, category, description,
 * howto, skills text[], resources text[])
 * branch: "All" is the sentinel used by beyond.html's isAll cross-branch badge.
 */
const beyondSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      set: (v) => (v?.toUpperCase() === "ALL" ? "All" : v?.toUpperCase()),
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: ["college", "startup", "gate", "national", "international"],
        message: "Invalid category",
      },
      required: true,
      default: "college",
    },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    howto: { type: String, default: "", trim: true, maxlength: 1000 },
    skills: { type: [String], default: [] },
    resources: { type: [String], default: [] },
    ...contentAuditFields,
  },
  { timestamps: true }
);

beyondSchema.index({ title: "text", description: "text" });
beyondSchema.index({ branch: 1, category: 1 });

export default mongoose.model("Beyond", beyondSchema);
