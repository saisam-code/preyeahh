import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const parentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: "" },
    relationship: {
      type: String,
      enum: ["Father", "Mother", "Guardian", "Other"],
      default: "Guardian",
    },
    associatedStudents: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        studentEmail: { type: String, lowercase: true, trim: true },
        isVerified: { type: Boolean, default: false },
        consentGranted: { type: Boolean, default: true },
        linkedAt: { type: Date, default: Date.now },
      },
    ],
    role: { type: String, default: "parent" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

parentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

parentSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

parentSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    relationship: this.relationship,
    associatedStudents: this.associatedStudents,
    role: "parent",
    isVerified: this.isVerified,
    createdAt: this.createdAt,
  };
};

export default mongoose.model("Parent", parentSchema);
