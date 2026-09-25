const mongoose = require("mongoose");

/**
 * Mirrors: CREATE TABLE role_interest (student_id, role_id, role_name,
 * branch, committed, UNIQUE(student_id, role_id))
 *
 * role_name/branch are denormalized copies (same as the original) so
 * admin's Role Interest Ranking table and CSV export don't need a join
 * per row — matches fetchAllRoleInterest()'s usage in admin.html.
 * The compound unique index reproduces the upsert-on-conflict behavior
 * of saveRoleInterest() in app.js (onConflict: "student_id,role_id").
 */
const roleInterestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    roleName: { type: String, required: true },
    branch: { type: String, required: true, uppercase: true },
    committed: { type: Boolean, default: false },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

roleInterestSchema.index({ student: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("RoleInterest", roleInterestSchema);
