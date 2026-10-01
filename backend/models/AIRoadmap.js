import mongoose from "mongoose";

const resourceRefSchema = new mongoose.Schema(
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
    description: { type: String, default: "" },
    isCompleted: { type: Boolean, default: false },
    resources: [resourceRefSchema],
  },
  { _id: true }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    topics: [topicSchema],
  },
  { _id: true }
);

// AI-generated, per-student learning path. Distinct from the human-curated Role/Guidance content.
const aiRoadmapSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    // Set when generated from a Role card; null when generated from a free-text topic
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", default: null },
    roleTitle: { type: String, default: "" },
    branch: { type: String, default: "", uppercase: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    estimatedWeeks: { type: Number, default: 4 },
    sections: [sectionSchema],
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("AIRoadmap", aiRoadmapSchema);
