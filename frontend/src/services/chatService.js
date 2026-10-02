import api from "./api.js";

// Paginated list: returns the full body ({ data: chats[], meta })
export const fetchChats = (params = {}) => api.get("/chat", { params }).then((r) => r.data);
export const createChat = (payload) => api.post("/chat", payload).then((r) => r.data.data);
export const fetchChat = (chatId) => api.get(`/chat/${chatId}`).then((r) => r.data.data);
export const exportChat = (chatId) => api.get(`/chat/${chatId}/export`, { responseType: "blob" }).then((r) => r.data);
export const sendChatMessage = (chatId, message) =>
  api.post(`/chat/${chatId}/message`, { message }).then((r) => r.data.data);
export const updateChat = (chatId, payload) => api.patch(`/chat/${chatId}`, payload).then((r) => r.data.data);
export const clearChatHistory = (chatId) => api.delete(`/chat/${chatId}/history`).then((r) => r.data);
export const deleteChat = (chatId) => api.delete(`/chat/${chatId}`).then((r) => r.data);
