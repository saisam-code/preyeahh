import mongoose from "mongoose";

/**
 * QuizResult Model (Phase 3.8)
 * Lightweight persistent aggregate learning record.
 * Retains permanent telemetry (score, topic, difficulty, date)
 * without storing ephemeral question text or answers after quiz TTL expiry.
 */
const quizResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    branch: {
      type: String,
      default: "",
      uppercase: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

quizResultSchema.index({ studentId: 1, completedAt: -1 });

export default mongoose.model("QuizResult", quizResultSchema);
