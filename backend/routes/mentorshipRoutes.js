import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/conversations", protect, async (req, res, next) => {
  try {
    const Conversation = mongoose.model("MentorshipConversation");
    const filter = req.user.role === "guide"
      ? { guideId: req.user.id }
      : req.user.role === "student"
        ? { studentId: req.user.id }
        : {};
    const conversations = await Conversation.find(filter).sort({ lastMessageAt: -1 }).limit(50).lean();
    res.status(200).json({ success: true, statusCode: 200, data: conversations });
  } catch (error) {
    next(error);
  }
});

router.get("/conversations/:id/messages", protect, async (req, res, next) => {
  try {
    const Conversation = mongoose.model("MentorshipConversation");
    const Message = mongoose.model("MentorshipMessage");
    const conversation = await Conversation.findById(req.params.id).lean();
    if (!conversation) return res.status(404).json({ success: false, statusCode: 404, message: "Conversation not found" });
    const participant = String(conversation.studentId) === req.user.id || String(conversation.guideId) === req.user.id;
    if (!participant) return res.status(403).json({ success: false, statusCode: 403, message: "Forbidden" });
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 50);
    const filter = { conversationId: conversation._id };
    if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
    const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.status(200).json({ success: true, statusCode: 200, data: messages.reverse() });
  } catch (error) {
    next(error);
  }
});

export default router;
