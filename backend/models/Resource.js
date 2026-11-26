import mongoose from "mongoose";
import { contentAuditFields } from "./ContentAudit.js";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "article", "documentation", "course", "github", "practice", "book"],
      required: true,
    },
    url: { type: String, required: true, unique: true },
    thumbnail: { type: String, default: "" },
    provider: { type: String, default: "" }, // e.g., "YouTube", "React Docs", "FreeCodeCamp"

    // Core search/matching fields
    technology: { type: String, required: true, lowercase: true, trim: true }, // e.g., "react", "node.js"
    category: { type: String, default: "", lowercase: true, trim: true }, // e.g., "frontend", "backend"
    tags: [{ type: String, lowercase: true, trim: true }], // e.g., ["hooks", "state management"]

    // Branches this resource is relevant for. Empty array = relevant to every branch.
    branches: [{ type: String, uppercase: true, trim: true }],

    sourceRepository: { type: String, default: "", trim: true, index: true },
    sourceListRepository: { type: String, default: "", trim: true },
    sourceCategory: { type: String, default: "", trim: true, index: true },
    sourceSubcategory: { type: String, default: "", trim: true },
    sourceId: { type: String, trim: true },
    sourceReference: { type: String, default: "" },
    sourceUrl: { type: String, default: "", trim: true },
    sourceLicense: { type: String, default: "" },
    resourceType: {
      type: String,
      enum: ["curated-list", "tutorial", "project", "course", "documentation", "article", "video", "tool", "repository", "other", ""],
      default: "",
      index: true,
    },
    relatedDomains: [{ type: String, lowercase: true, trim: true }],
    relatedRoles: [{ type: String, lowercase: true, trim: true }],
    relatedSkills: [{ type: String, lowercase: true, trim: true }],
    relatedTechnologies: [{ type: String, lowercase: true, trim: true }],
    attribution: { type: String, default: "" },
    importStatus: {
      type: String,
      enum: ["mapped", "duplicate", "excluded", "failed", ""],
      default: "",
      index: true,
    },
    exclusionReason: { type: String, default: "" },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all"],
      default: "all",
    },
    estimatedDuration: { type: Number, default: 0 }, // in minutes

    // Metadata / Stats
    learningObjectives: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },

    // Audit
    isCurated: { type: Boolean, default: true },
    ...contentAuditFields,
  },
  { timestamps: true }
);

// Compound index for fast searching based on AI generated tags
resourceSchema.index({ technology: 1, tags: 1, difficulty: 1 });
resourceSchema.index({ branches: 1 });
resourceSchema.index({ sourceId: 1 }, { unique: true, sparse: true });
resourceSchema.index({ relatedDomains: 1 });
resourceSchema.index({ relatedRoles: 1 });
// Text index for standard search bar
resourceSchema.index({ title: "text", description: "text", tags: "text" });

// Virtual for formatted output (id mapping)
resourceSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Resource", resourceSchema);
