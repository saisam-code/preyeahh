import api from "./api.js";

export const listRoleMentors = (roleId) =>
  api.get("/students/mentorship/mentors", { params: { roleId } }).then((r) => r.data.data);
export const startMentorshipConversation = (payload) =>
  api.post("/students/mentorship", payload).then((r) => r.data.data);
export const listMentorshipConversations = (mode) =>
  api.get(mode === "guide" ? "/guides/me/conversations" : "/students/mentorship").then((r) => r.data.data);
export const fetchMentorshipConversation = (mode, id) =>
  api.get(mode === "guide" ? `/guides/me/conversations/${id}` : `/students/mentorship/${id}`).then((r) => r.data.data);
export const sendMentorshipMessage = (mode, id, content) =>
  api.post(mode === "guide" ? `/guides/me/conversations/${id}/messages` : `/students/mentorship/${id}/messages`, { content }).then((r) => r.data.data);
