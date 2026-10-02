import mongoose from "mongoose";

const contributorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "guide"], required: true },
  },
  { _id: false }
);

const editEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "guide"], required: true },
    editedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export const contentAuditFields = {
  createdBy: { type: contributorSchema, default: null },
  editHistory: { type: [editEventSchema], default: [] },
};