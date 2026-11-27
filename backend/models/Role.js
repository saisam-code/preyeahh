import mongoose from "mongoose";
import { contentAuditFields } from "./ContentAudit.js";
import { careerRealitySchema, careerExperimentSchema, verificationMetadataSchema } from "./CareerIntelligence.js";
import { normalizeEducationStages } from "../constants/educationStages.js";

/**
 * Mirrors: CREATE TABLE roles (... guidance_overview, guidance_steps,
 * guidance_skills, guidance_resources ...)
 *
 * The 4 guidance_* columns are embedded as `guidance` because app.js
 * always reads/writes them together as a single object
 * (r.guidance = { overview, steps, skills, resources }) — see getData()
 * and saveRole() in the original code. Embedding avoids an extra query
 * on every role-detail-modal open, which is the hottest read path.
 */
const roleGuidanceSchema = new mongoose.Schema(
  {
    overview: { type: String, default: "", trim: true },
    steps: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    resources: { type: [String], default: [] }, // "Label|https://url" strings, parsed client-side via parseResource()
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Role title is required"],
      trim: true,
      maxlength: 120,
    },
    slug: { type: String, lowercase: true, trim: true, maxlength: 180, index: true },
    branch: {
      type: String,
      uppercase: true,
      trim: true,
    },
    branchIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Branch" }],
      default: [],
    },
    domain: { type: String, default: "Technology & Engineering", trim: true },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain", default: null, index: true },
    subdomainId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerSubdomain", default: null, index: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", default: null, index: true },
    category: {
      type: String,
      enum: ["Conventional", "Unconventional", "Emerging", "Creative", "Sports & Performing Arts"],
      default: "Conventional",
      index: true,
    },
    type: {
      type: String,
      enum: ["core", "non-core", "general", ""],
      default: "general",
      required: false,
    },
    educationStages: {
      type: [String],
      default: ["Undergraduate", "Postgraduate"], // e.g. Class 6-8, Class 9-10, Class 11-12, Diploma, Undergraduate, Postgraduate, PhD
      set: normalizeEducationStages,
    },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    guidance: { type: roleGuidanceSchema, default: () => ({}) },
    reality: { type: careerRealitySchema, default: () => ({}) },
    experiments: [careerExperimentSchema],
    verification: { type: verificationMetadataSchema, default: () => ({ status: "UNVERIFIED" }) },
    ...contentAuditFields,
  },
  { timestamps: true }
);

// Same role title shouldn't be duplicated within a branch (admin UX safety net —
// Global roles are unique by subdomain and slug. Institution copies use the
// institution scope as part of the unique key.
roleSchema.index(
  { subdomainId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { institution: null } }
);
roleSchema.index(
  { institution: 1, subdomainId: 1, slug: 1 },
  { unique: true, partialFilterExpression: { institution: { $type: "objectId" } } }
);
roleSchema.index({ branchIds: 1 });

export default mongoose.model("Role", roleSchema);
