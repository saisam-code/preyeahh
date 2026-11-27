import mongoose from "mongoose";

const mentorshipMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "MentorshipConversation", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ["student", "guide"], required: true },
    content: { type: String, required: true, maxlength: 2000, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

mentorshipMessageSchema.index({ conversationId: 1, createdAt: -1 });
mentorshipMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("MentorshipMessage", mentorshipMessageSchema);
