const mongoose = require("mongoose");

/**
 * Mirrors: CREATE TABLE role_requests (role_name, branch, summary,
 * student_id, email, status, created_at)
 *
 * NOTE: in the original app, submitRoleRequest() in roles.html actually
 * wrote to localStorage instead of this Supabase table (the table existed
 * in schema but was never used by the frontend). Phase 3 wires the real
 * API against this model so "Request a Role" persists server-side and is
 * visible to every admin, not just the browser that submitted it.
 */
const roleRequestSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      trim: true,
      maxlength: 150,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      uppercase: true,
      trim: true,
    },
    summary: {
      type: String,
      required: [true, "Summary is required"],
      trim: true,
      maxlength: 1000,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null, // request can be submitted while logged out, same as original modal
    },
    email: { type: String, default: null, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "dismissed"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoleRequest", roleRequestSchema);
