import api from "./api.js";

export const fetchLearningProgress = () => api.get("/progress").then((r) => r.data.data);
export const fetchQuizProgress = () => api.get("/progress/quizzes").then((r) => r.data.data);
export const fetchPerformance = () => api.get("/performance").then((r) => r.data.data);
