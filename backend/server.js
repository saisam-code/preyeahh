import "dotenv/config";

import { validateEnv } from "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import "./models/index.js"; // registers every schema before the app starts handling requests
import http from "node:http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

validateEnv();

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  const httpServer = http.createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.purpose === "google_onboarding") return next(new Error("Unauthorized"));
      socket.user = { id: String(decoded.id), role: decoded.role };
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.on("conversation:join", async (conversationId, ack) => {
      try {
        if (!mongoose.isValidObjectId(conversationId)) throw new Error("Invalid conversation");
        const Conversation = mongoose.model("MentorshipConversation");
        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) throw new Error("Conversation not found");
        const participant = String(conversation.studentId) === socket.user.id || String(conversation.guideId) === socket.user.id;
        if (!participant) throw new Error("Forbidden");
        socket.join(`conv:${conversationId}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const conversationId = payload?.conversationId;
        const content = String(payload?.content || "").trim().slice(0, 2000);
        if (!mongoose.isValidObjectId(conversationId) || !content) throw new Error("Invalid message");
        const Conversation = mongoose.model("MentorshipConversation");
        const Message = mongoose.model("MentorshipMessage");
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new Error("Conversation not found");
        const participant = String(conversation.studentId) === socket.user.id || String(conversation.guideId) === socket.user.id;
        if (!participant) throw new Error("Forbidden");
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const message = await Message.create({
          conversationId,
          senderId: socket.user.id,
          senderRole: socket.user.role,
          content,
          expiresAt,
        });
        const isGuide = socket.user.role === "guide";
        conversation.lastMessageAt = now;
        conversation.lastMessagePreview = content.slice(0, 200);
        conversation.expiresAt = expiresAt;
        conversation.unreadForStudent = isGuide ? (conversation.unreadForStudent || 0) + 1 : 0;
        conversation.unreadForGuide = isGuide ? 0 : (conversation.unreadForGuide || 0) + 1;
        await conversation.save();
        const result = { id: message._id, conversationId, senderId: socket.user.id, senderRole: socket.user.role, content, createdAt: message.createdAt };
        io.to(`conv:${conversationId}`).emit("message:new", result);
        ack?.({ ok: true, data: result });
      } catch (error) {
        ack?.({ ok: false, error: error.message });
      }
    });
  });

  const server = httpServer.listen(PORT, () => {
    logger.info(`[server] Preyeahh API running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });

  // Fail loudly on unhandled promise rejections instead of a silent hang
  process.on("unhandledRejection", (err) => {
    logger.error(`[server] Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

start();
