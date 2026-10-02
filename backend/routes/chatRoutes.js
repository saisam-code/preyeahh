import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import {
  chatIdParamRule,
  listChatsRules,
  createChatRules,
  updateChatRules,
  sendMessageRules,
} from "../validators/chatValidator.js";
import {
  createChat,
  listChats,
  getChat,
  exportChat,
  sendMessage,
  updateChat,
  clearChatHistory,
  archiveChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect, authorize("student"));

router.post("/", createChatRules, validate, createChat);
router.get("/", listChatsRules, validate, listChats);
router.get("/:chatId/export", chatIdParamRule, validate, exportChat);
router.get("/:chatId", chatIdParamRule, validate, getChat);
router.post("/:chatId/message", aiLimiter, sendMessageRules, validate, sendMessage);
router.patch("/:chatId", updateChatRules, validate, updateChat);
router.delete("/:chatId/history", chatIdParamRule, validate, clearChatHistory);
router.delete("/:chatId", chatIdParamRule, validate, archiveChat);

export default router;
