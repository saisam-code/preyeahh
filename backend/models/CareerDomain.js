import mongoose from "mongoose";

/**
 * CareerDomain Model (Phase 3.4)
 * Represents the 12 major career universe domains on the Career Orbit Wheel.
 */
const careerDomainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#2563eb",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("CareerDomain", careerDomainSchema);
