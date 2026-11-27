import mongoose from "mongoose";

/**
 * Mirrors: CREATE TABLE branches (name text PRIMARY KEY)
 * Branch name is a tag — Role uses branchIds and Guidance may retain legacy scope
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
    domainIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain" }],
      default: [],
    },
  },
  { timestamps: true }
);

branchSchema.index({ domainIds: 1 });

export default mongoose.model("Branch", branchSchema);
