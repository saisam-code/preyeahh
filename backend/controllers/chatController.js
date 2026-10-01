import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as chatService from "../services/chatService.js";

// POST /api/chat
export const createChat = asyncHandler(async (req, res) => {
  const chat = await chatService.createChat(req.user, req.body);
  res.status(201).json(new ApiResponse(201, chat, "Chat session created"));
});

// GET /api/chat
export const listChats = asyncHandler(async (req, res) => {
  const { items, meta } = await chatService.listChats(req.user.id, req.query);
  res.status(200).json(new ApiResponse(200, items, "Chats fetched", meta));
});

// GET /api/chat/:chatId
export const getChat = asyncHandler(async (req, res) => {
  const chat = await chatService.getChat(req.params.chatId, req.user.id);
  res.status(200).json(new ApiResponse(200, chat, "Chat fetched"));
});

// POST /api/chat/:chatId/message
export const sendMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendMessage(req.params.chatId, req.user, req.body.message);
  res.status(200).json(new ApiResponse(200, result, "Message sent"));
});

// PATCH /api/chat/:chatId
export const updateChat = asyncHandler(async (req, res) => {
  const chat = await chatService.updateChat(req.params.chatId, req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, chat, "Chat updated"));
});

// DELETE /api/chat/:chatId/history
export const clearChatHistory = asyncHandler(async (req, res) => {
  const chat = await chatService.clearChatHistory(req.params.chatId, req.user.id);
  res.status(200).json(new ApiResponse(200, chat, "Chat history cleared"));
});

// DELETE /api/chat/:chatId
export const archiveChat = asyncHandler(async (req, res) => {
  await chatService.archiveChat(req.params.chatId, req.user.id);
  res.status(200).json(new ApiResponse(200, null, "Chat deleted"));
});
