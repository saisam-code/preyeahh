import mongoose from "mongoose";
import { contentAuditFields } from "./ContentAudit.js";
import { careerRealitySchema, careerExperimentSchema, verificationMetadataSchema } from "./CareerIntelligence.js";

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
    branch: {
      type: String,
      required: [true, "Branch is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    domain: { type: String, default: "Engineering & Technology", trim: true },
    category: {
      type: String,
      enum: ["Conventional", "Unconventional", "Emerging", "Creative", "Sports & Performing Arts"],
      default: "Conventional",
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ["core", "non-core"],
        message: "Type must be either 'core' or 'non-core'",
      },
      required: true,
    },
    educationStages: {
      type: [String],
      default: ["Undergraduate", "Postgraduate"], // e.g. Class 6-8, Class 9-10, Class 11-12, Diploma, Undergraduate, Postgraduate, PhD
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
// not present as a DB constraint in the original schema, but prevents accidental
// double-adds from the admin/guide "Add Role" modals).
roleSchema.index({ title: 1, branch: 1 }, { unique: true });

// Cascade delete: mirrors deleteRole() in supabase.js
// ("await _sb.from('guidance').delete().eq('role_id', id)").
roleSchema.pre("findOneAndDelete", async function (next) {
  const role = await this.model.findOne(this.getQuery());
  if (!role) return next();
  const Guidance = mongoose.model("Guidance");
  await Guidance.deleteMany({ role: role._id });
  next();
});

export default mongoose.model("Role", roleSchema);
