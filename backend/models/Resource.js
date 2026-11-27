import mongoose from "mongoose";
import { contentAuditFields } from "./ContentAudit.js";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    type: {
      type: String,
      enum: ["video", "article", "documentation", "course", "github", "practice", "book"],
      required: true,
    },
    url: { type: String, required: true, unique: true, trim: true },
    provider: { type: String, default: "", trim: true },
    domainIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain", index: true }],
    subdomainIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CareerSubdomain", index: true }],
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    skills: [{ type: String, trim: true }],
    tags: [{ type: String, lowercase: true, trim: true }],
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all"],
      default: "all",
    },
    educationStages: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
    ...contentAuditFields,
  },
  { timestamps: true }
);

resourceSchema.index({ domainIds: 1, difficulty: 1, isActive: 1 });
resourceSchema.index({ roleIds: 1 });
resourceSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Resource", resourceSchema);
