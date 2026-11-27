import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["EXAM", "OPPORTUNITY"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, lowercase: true, trim: true, maxlength: 220 },
    category: { type: String, required: true, trim: true },
    domainIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain", index: true }],
    subdomainIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CareerSubdomain", index: true }],
    roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role", index: true }],
    organizer: { type: String, default: "", trim: true },
    mode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      default: "online",
    },
    applyUrl: { type: String, default: "", trim: true },
    startDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    educationLevels: [{ type: String, trim: true }],
    eligibility: { type: String, default: "", maxlength: 1500 },
    cost: { type: String, default: "", maxlength: 500 },
    description: { type: String, default: "", maxlength: 3000 },
    isActive: { type: Boolean, default: true, index: true },
    dedupeKey: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

opportunitySchema.index({ kind: 1, deadline: 1, isActive: 1 });
opportunitySchema.index({ domainIds: 1, kind: 1, isActive: 1 });

export default mongoose.model("Opportunity", opportunitySchema);
