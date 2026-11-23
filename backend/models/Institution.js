import mongoose from "mongoose";

/**
 * Institution Model (Schools, Colleges, Universities, Training & Placement Cells)
 */
const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, uppercase: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ["School", "Junior College", "Engineering College", "University", "Polytechnic"],
      default: "Engineering College",
    },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    associationCode: { type: String, unique: true, sparse: true, uppercase: true }, // Code students use to join
    isActive: { type: Boolean, default: true },
    contactEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

/**
 * Student Institution Membership
 * Never trust client claim; must have status ACTIVE
 */
const institutionMembershipSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "REMOVED"],
      default: "PENDING",
      index: true,
    },
    source: {
      type: String,
      enum: ["INVITATION", "ASSOCIATION_CODE", "STUDENT_REQUEST"],
      default: "ASSOCIATION_CODE",
    },
    rollNumberOrStudentId: { type: String, default: "" },
    joinedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

institutionMembershipSchema.index({ student: 1, institution: 1 }, { unique: true });

export const Institution = mongoose.model("Institution", institutionSchema);
export const InstitutionMembership = mongoose.model("InstitutionMembership", institutionMembershipSchema);
