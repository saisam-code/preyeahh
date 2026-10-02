import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true, _id: true }
);

// A named conversation thread owned by one student.
const chatSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    title: { type: String, default: "New Chat", maxlength: 200 },
    topic: { type: String, default: "" },
    // Optional Role being explored; gives the AI the role's curated overview + skills as context
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    // Branch snapshot at creation, so the AI keeps branch context even if a student later switches view
    branch: { type: String, default: "", uppercase: true, trim: true },
    messages: { type: [messageSchema], default: [] },
    isArchived: { type: Boolean, default: false }, // soft delete
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

chatSchema.index({ studentId: 1, isArchived: 1, updatedAt: -1 });
chatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Chat", chatSchema);
