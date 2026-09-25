const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "article", "course", "documentation", "book", "practice", "github"],
      default: "article",
    },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    resources: [resourceSchema],
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    topics: [topicSchema],
  },
  { _id: true }
);

const aiRoadmapSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    // Linked to PreYeah role — optional, null if student generated without a role
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    roleTitle: { type: String, default: "" },
    branch: { type: String, default: "", uppercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    estimatedWeeks: { type: Number, default: 4 },
    sections: [sectionSchema],
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIRoadmap", aiRoadmapSchema);