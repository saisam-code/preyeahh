import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, select: false }, // For Placement Cell / Institution Admin login
    contactPerson: { type: String, default: "" },
    designation: { type: String, default: "Placement Officer / Principal" },
    phone: { type: String, default: "" },
    studentCountApprox: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING",
      index: true,
    },
    isActive: { type: Boolean, default: true },
    role: { type: String, default: "institution" },
  },
  { timestamps: true }
);

institutionSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

institutionSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

institutionSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    code: this.code,
    category: this.category,
    location: this.location,
    website: this.website,
    contactEmail: this.contactEmail,
    contactPerson: this.contactPerson,
    designation: this.designation,
    associationCode: this.associationCode,
    status: this.status,
    role: "institution",
    createdAt: this.createdAt,
  };
};

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
