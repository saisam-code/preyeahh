import mongoose from "mongoose";

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
    type: {
      type: String,
      enum: {
        values: ["core", "non-core"],
        message: "Type must be either 'core' or 'non-core'",
      },
      required: true,
    },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    guidance: { type: roleGuidanceSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Same role title shouldn't be duplicated within a branch (admin UX safety net —
// not present as a DB constraint in the original schema, but prevents accidental
// double-adds from the admin/guide "Add Role" modals).
roleSchema.index({ title: 1, branch: 1 }, { unique: true });

// Text search support for roles.html's search box (title + description).
roleSchema.index({ title: "text", description: "text" });

// Cascade delete: mirrors deleteRole() in supabase.js
// ("await _sb.from('guidance').delete().eq('role_id', id)").
roleSchema.pre("findOneAndDelete", async function (next) {
  const role = await this.model.findOne(this.getQuery());
  if (!role) return next();
  const Guidance = mongoose.model("Guidance");
  await Guidance.deleteMany({ role: role._id });
  next();
});

// FIX: was `mongoose.model("Role", roleSchema)` — but backend/models/User.js
// declares `careerRole: { ref: "CareerRole" }`. A mismatched ref name means
// `.populate("careerRole")` silently returns null forever. Registered name
// must match the ref string, and the filename, so: "CareerRole".
export default mongoose.model("CareerRole", roleSchema);
