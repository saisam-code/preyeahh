import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, required: true },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    questions: [questionSchema],
    
    // Progress/Results tracking
    isCompleted: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    userAnswers: [{ type: String }], // The answers the user submitted
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted output (id mapping)
quizSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
