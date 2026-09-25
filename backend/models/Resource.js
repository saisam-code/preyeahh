import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["video", "article", "documentation", "course", "github", "practice", "book"],
      required: true,
    },
    url: { type: String, required: true, unique: true },
    thumbnail: { type: String, default: "" },
    provider: { type: String, default: "" }, // e.g., "YouTube", "React Docs", "FreeCodeCamp"

    // Core search/matching fields
    technology: { type: String, required: true, lowercase: true, trim: true }, // e.g., "react", "node.js"
    category: { type: String, default: "", lowercase: true, trim: true }, // e.g., "frontend", "backend"
    tags: [{ type: String, lowercase: true, trim: true }], // e.g., ["hooks", "state management"]

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "all"],
      default: "all",
    },
    estimatedDuration: { type: Number, default: 0 }, // in minutes

    // Metadata / Stats
    learningObjectives: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },

    // Audit
    isCurated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound index for fast searching based on AI generated tags
resourceSchema.index({ technology: 1, tags: 1, difficulty: 1 });
// Text index for standard search bar
resourceSchema.index({ title: "text", description: "text", tags: "text" });

// Virtual for formatted output (id mapping)
resourceSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
