import {
  createChatSession,
  getUserChats,
  getChatById,
  sendMessage,
  clearChatHistory,
  archiveChatSession,
  updateChatSession,
} from "../services/chat.service.js";

/**
 * POST /api/chat
 * Create a new chat session.
 */
export const createChatController = async (req, res) => {
  try {
    const { title, topic } = req.body;
    const chat = await createChatSession(req.user.userId, { title, topic });

    return res.status(201).json({
      success: true,
      message: "Chat session created",
      chat: {
        id: chat._id.toString(),
        title: chat.title,
        topic: chat.topic,
        messages: [],
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in createChatController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * GET /api/chat
 * Get all chat sessions for the authenticated user.
 */
export const getUserChatsController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await getUserChats(req.user.userId, page, limit);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in getUserChatsController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * GET /api/chat/:chatId
 * Get a specific chat session with message history.
 */
export const getChatByIdController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await getChatById(chatId, req.user.userId);

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("Error in getChatByIdController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * POST /api/chat/:chatId/message
 * Send a user message and receive an AI response.
 */
export const sendMessageController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    const result = await sendMessage(chatId, req.user.userId, message);

    return res.status(200).json({
      success: true,
      chatId: result.chatId,
      title: result.title,
      message: result.assistantMessage,
    });
  } catch (error) {
    console.error("Error in sendMessageController:", error);

    // Handle AI quota / rate-limit errors cleanly (Groq + Gemini)
    if (
      error.status === 429 ||
      error.statusCode === 429 ||
      error.message?.includes("429") ||
      error.message?.includes("Too Many Requests") ||
      error.message?.includes("quota") ||
      error.message?.includes("rate_limit")
    ) {
      return res.status(429).json({
        success: false,
        message:
          "AI service is temporarily unavailable due to rate limits. Please wait a moment and try again.",
        retryAfter: 60,
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * DELETE /api/chat/:chatId/history
 * Clear message history in a chat session.
 */
export const clearChatHistoryController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await clearChatHistory(chatId, req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Chat history cleared",
      chat: result,
    });
  } catch (error) {
    console.error("Error in clearChatHistoryController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * DELETE /api/chat/:chatId
 * Archive (soft-delete) a chat session.
 */
export const archiveChatController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const result = await archiveChatSession(chatId, req.user.userId);

    return res.status(200).json({
      success: true,
      message: result.message,
      chatId: result.id,
    });
  } catch (error) {
    console.error("Error in archiveChatController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * PATCH /api/chat/:chatId
 * Update chat title or topic.
 */
export const updateChatController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title, topic } = req.body;

    if (title === undefined && topic === undefined) {
      return res.status(400).json({
        success: false,
        message: "At least one of title or topic is required",
      });
    }

    const chat = await updateChatSession(chatId, req.user.userId, {
      title,
      topic,
    });

    return res.status(200).json({
      success: true,
      message: "Chat updated successfully",
      chat,
    });
  } catch (error) {
    console.error("Error in updateChatController:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
