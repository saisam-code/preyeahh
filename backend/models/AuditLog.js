import mongoose from "mongoose";

/**
 * AuditLog Model (Item 1.13)
 * Tracks administrative inspection of private chats and sensitive student records.
 * An explicit justification/reason must accompany transcript accesses.
 */
const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["Chat", "MentorshipConversation", "Student"],
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Audit reason is required to inspect student transcripts"],
      minlength: 5,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("AuditLog", auditLogSchema);
