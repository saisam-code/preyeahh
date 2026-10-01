import Chat from "../models/Chat.js";
import ApiError from "../utils/ApiError.js";
import { chatCompletion } from "./groqService.js";
import { getRoleContext } from "./roleContextService.js";
import { passivelyUpdateProfile } from "./profileService.js";
import { buildChatContextPrompt, buildGroqMessages } from "../utils/aiPrompts.js";

// Run passive profile extraction every N stored messages (10 = every 5 exchanges)
const PASSIVE_EXTRACTION_INTERVAL = 10;

const chatSummary = (c) => ({
  id: c._id.toString(),
  title: c.title,
  topic: c.topic,
  branch: c.branch,
  roleId: c.roleId ? c.roleId.toString() : null,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

const messageDto = (m) => ({
  id: m._id.toString(),
  role: m.role,
  content: m.content,
  createdAt: m.createdAt,
});

async function findOwnedChat(chatId, studentId) {
  const chat = await Chat.findOne({ _id: chatId, studentId, isArchived: false });
  if (!chat) throw ApiError.notFound("Chat session not found");
  return chat;
}

export async function createChat(student, { title, topic, roleId } = {}) {
  const role = await getRoleContext(roleId);
  const chat = await Chat.create({
    studentId: student.id,
    title: title?.trim() || "New Chat",
    topic: topic?.trim() || role?.title || "",
    roleId: role?.id || null,
    branch: student.branch || "",
  });
  return { ...chatSummary(chat), messages: [] };
}

export async function listChats(studentId, { page = 1, limit = 20 } = {}) {
  const filter = { studentId, isArchived: false };
  const [chats, total] = await Promise.all([
    Chat.find(filter)
      .select("title topic branch roleId createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Chat.countDocuments(filter),
  ]);
  return { items: chats.map(chatSummary), meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) } };
}

export async function getChat(chatId, studentId) {
  const chat = await findOwnedChat(chatId, studentId);
  return { ...chatSummary(chat), messages: chat.messages.map(messageDto) };
}

/**
 * Stores the user message, asks Groq (with branch / preference / role context)
 * and stores the reply. Nothing is persisted if the AI call fails.
 */
export async function sendMessage(chatId, student, text) {
  const chat = await findOwnedChat(chatId, student.id);
  const message = text.trim();

  const prefs = student.doc?.preferences?.toObject?.() ?? student.doc?.preferences ?? {};
  const roleContext = await getRoleContext(chat.roleId).catch(() => null);

  const systemPrompt = buildChatContextPrompt({
    topic: chat.topic,
    branch: chat.branch || student.branch || "",
    roleContext,
    preferences: prefs,
  });
  const groqMessages = [...buildGroqMessages(chat.messages, systemPrompt), { role: "user", content: message }];

  const reply =
    (await chatCompletion(groqMessages, { temperature: 0.7, maxTokens: 2048 })) ||
    "I could not generate a response. Please try again.";

  const isFirst = chat.messages.length === 0;
  chat.messages.push({ role: "user", content: message }, { role: "assistant", content: reply });

  if (isFirst && chat.title === "New Chat") {
    const words = message.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
    chat.title = words.slice(0, 6).join(" ") || "New Chat";
  }
  await chat.save();

  if (chat.messages.length % PASSIVE_EXTRACTION_INTERVAL === 0) {
    passivelyUpdateProfile(student.id, chat.messages, prefs); // intentionally not awaited; never throws
  }

  return { chatId: chat._id.toString(), title: chat.title, message: messageDto(chat.messages.at(-1)) };
}

export async function updateChat(chatId, studentId, { title, topic }) {
  const chat = await findOwnedChat(chatId, studentId);
  if (title !== undefined) chat.title = title.trim() || chat.title;
  if (topic !== undefined) chat.topic = topic.trim();
  await chat.save();
  return chatSummary(chat);
}

export async function clearChatHistory(chatId, studentId) {
  const chat = await findOwnedChat(chatId, studentId);
  chat.messages = [];
  chat.title = "New Chat";
  await chat.save();
  return { id: chat._id.toString(), title: chat.title };
}

export async function archiveChat(chatId, studentId) {
  const chat = await findOwnedChat(chatId, studentId);
  chat.isArchived = true;
  await chat.save();
}
