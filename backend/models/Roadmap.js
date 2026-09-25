import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "article", "course", "documentation", "book"],
      default: "article",
    },
    url: { type: String, default: "" }, // Can be an actual link or a search query if AI isn't sure
  },
  { _id: true }
);

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    resources: [resourceSchema],
  },
  {
    _id: true,
    toJSON: {
      transform: (doc, ret) => {
        if (ret._id) ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    topics: [topicSchema],
  },
  {
    _id: true,
    toJSON: {
      transform: (doc, ret) => {
        if (ret._id) ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, required: true },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    estimatedWeeks: { type: Number, required: true },
    sections: [sectionSchema],
    isCompleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Virtual for formatted output (id mapping)
roadmapSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret._id) ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  },
});

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

export default Roadmap;
