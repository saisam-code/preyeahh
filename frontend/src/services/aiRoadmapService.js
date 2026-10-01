import api from "./api.js";

export const generateRoadmap = (payload) => api.post("/ai-roadmaps/generate", payload).then((r) => r.data.data);
// Paginated list: returns the full body ({ data: roadmaps[], meta })
export const fetchRoadmaps = (params = {}) => api.get("/ai-roadmaps", { params }).then((r) => r.data);
export const fetchRoadmap = (id) => api.get(`/ai-roadmaps/${id}`).then((r) => r.data.data);
export const setTopicCompleted = (id, topicId, isCompleted) =>
  api.patch(`/ai-roadmaps/${id}/progress`, { topicId, isCompleted }).then((r) => r.data.data);
export const deleteRoadmap = (id) => api.delete(`/ai-roadmaps/${id}`).then((r) => r.data);
