import mongoose from "mongoose";

const sourceInventorySchema = new mongoose.Schema(
  {
    sourceId: { type: String, required: true, unique: true },
    duplicateOf: { type: String, default: "" },
    sourceRepository: { type: String, required: true, index: true },
    sourceListRepository: { type: String, default: "" },
    sourceVersion: { type: String, default: "" },
    sourceCategory: { type: String, default: "", index: true },
    sourceSubcategory: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
    sourceReference: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },
    sourceLicense: { type: String, default: "" },
    type: { type: String, default: "" },
    resourceType: { type: String, default: "" },
    technology: { type: String, default: "" },
    relatedDomains: [{ type: String, lowercase: true, trim: true }],
    relatedRoles: [{ type: String, lowercase: true, trim: true }],
    relatedSkills: [{ type: String, lowercase: true, trim: true }],
    relatedTechnologies: [{ type: String, lowercase: true, trim: true }],
    importStatus: { type: String, enum: ["mapped", "duplicate", "excluded", "failed"], required: true, index: true },
    exclusionReason: { type: String, default: "" },
    sourceLine: { type: String, default: "" },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

sourceInventorySchema.index({ sourceRepository: 1, sourceCategory: 1, sourceSubcategory: 1 });

export default mongoose.model("SourceInventory", sourceInventorySchema);
