import mongoose from "mongoose";

const mentorshipMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ["student", "guide"], required: true },
    content: { type: String, required: true, maxlength: 2000, trim: true },
  },
  { timestamps: true }
);

const mentorshipConversationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "Guide", required: true, index: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    branch: { type: String, required: true, uppercase: true, trim: true, index: true },
    messages: { type: [mentorshipMessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now },
    guideReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

mentorshipConversationSchema.index({ studentId: 1, guideId: 1, roleId: 1 }, { unique: true });
mentorshipConversationSchema.index({ guideId: 1, lastMessageAt: -1 });
mentorshipConversationSchema.index({ studentId: 1, lastMessageAt: -1 });

export default mongoose.model("MentorshipConversation", mentorshipConversationSchema);