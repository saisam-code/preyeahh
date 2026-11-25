import mongoose from "mongoose";

const careerSubdomainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    domainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerDomain",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

careerSubdomainSchema.index(
  { domainId: 1, branchId: 1, slug: 1 },
  { unique: true, name: "domain_branch_slug_unique" }
);
careerSubdomainSchema.index(
  { domainId: 1, branchId: 1, displayOrder: 1 },
  { name: "domain_branch_order" }
);

export default mongoose.model("CareerSubdomain", careerSubdomainSchema);
