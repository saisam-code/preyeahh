import mongoose from "mongoose";

/**
 * ParentLink Model
 * Manages explicit relationship, permissions, and parental consent
 * between a Parent and a Student. No auto-link permitted.
 */
const parentLinkSchema = new mongoose.Schema(
  {
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REVOKED"],
      default: "PENDING",
      index: true,
    },
    createdBy: {
      type: String,
      enum: ["PARENT", "STUDENT"],
      default: "PARENT",
    },
    permissions: {
      viewMilestones: { type: Boolean, default: true },
      viewAttendance: { type: Boolean, default: true },
      viewPerformance: { type: Boolean, default: true },
      canMessageCounselor: { type: Boolean, default: true },
    },
    // Consent grant required for minors (< 18) under DPDP Act
    // TODO: Review DPDP Act parental-consent verification mechanisms with legal counsel
    parentalConsentGranted: {
      type: Boolean,
      default: false,
    },
    consentGrantedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Exactly one link record between a given parent and student
parentLinkSchema.index({ parent: 1, student: 1 }, { unique: true });

export default mongoose.model("ParentLink", parentLinkSchema);
