import mongoose from "mongoose";

const mentorshipConversationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "Guide", required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    domainId: { type: mongoose.Schema.Types.ObjectId, ref: "CareerDomain", default: null },
    status: { type: String, enum: ["OPEN", "ARCHIVED"], default: "OPEN", index: true },
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: "", maxlength: 200 },
    unreadForStudent: { type: Number, default: 0, min: 0 },
    unreadForGuide: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mentorshipConversationSchema.index(
  { studentId: 1, guideId: 1, roleId: 1, domainId: 1 },
  { unique: true }
);
mentorshipConversationSchema.index({ guideId: 1, lastMessageAt: -1 });
mentorshipConversationSchema.index({ studentId: 1, lastMessageAt: -1 });
mentorshipConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("MentorshipConversation", mentorshipConversationSchema);
