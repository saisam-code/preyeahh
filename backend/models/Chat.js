import mongoose from "mongoose";

// Individual message within a chat session
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: true,
  }
);

// Chat session (a named conversation thread per user)
const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Chat",
      maxlength: 200,
    },
    topic: {
      type: String,
      default: "",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    // Soft-delete flag
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate title from the first user message if not set
chatSchema.pre("save", async function () {
  if (this.messages.length > 0 && this.title === "New Chat") {
    const firstUserMessage = this.messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      // Truncate first message to 60 chars as title
      this.title = firstUserMessage.content.slice(0, 60).trim();
    }
  }
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
