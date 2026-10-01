import api from "./api.js";

export const generateQuiz = (payload) => api.post("/quiz/generate", payload).then((r) => r.data.data);
// Paginated list: returns the full body ({ data: quizzes[], meta })
export const fetchQuizzes = (params = {}) => api.get("/quiz", { params }).then((r) => r.data);
export const fetchQuiz = (id) => api.get(`/quiz/${id}`).then((r) => r.data.data);
export const submitQuiz = (id, answers) => api.post(`/quiz/${id}/submit`, { answers }).then((r) => r.data.data);
export const deleteQuiz = (id) => api.delete(`/quiz/${id}`).then((r) => r.data);
