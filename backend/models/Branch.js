const mongoose = require("mongoose");

/**
 * Mirrors: CREATE TABLE branches (name text PRIMARY KEY)
 * Branch name is the natural key — Role/Beyond/Guidance store this
 * same string in their own `branch` field (no ObjectId join needed),
 * exactly like the original Postgres FK-by-name design.
 */
const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 20,
    },
  },
  { timestamps: true }
);

// Cascade delete: removing a branch removes its roles (which cascades to
// their guidance via Role's own pre-hook) and any branch-wide/global
// beyond & guidance entries scoped to it. Mirrors deleteBranch() in supabase.js.
branchSchema.pre("findOneAndDelete", async function (next) {
  const branch = await this.model.findOne(this.getQuery());
  if (!branch) return next();

  const Role = mongoose.model("Role");
  const Beyond = mongoose.model("Beyond");
  const Guidance = mongoose.model("Guidance");

  const roles = await Role.find({ branch: branch.name }).select("_id");
  const roleIds = roles.map((r) => r._id);

  await Guidance.deleteMany({ role: { $in: roleIds } });
  await Guidance.deleteMany({ branch: branch.name });
  await Beyond.deleteMany({ branch: branch.name });
  await Role.deleteMany({ branch: branch.name });

  next();
});

module.exports = mongoose.model("Branch", branchSchema);
