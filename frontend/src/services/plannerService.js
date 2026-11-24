import api from "./api.js";

export const getStudentPlan = () => api.get("/planner").then((r) => r.data.data);
export const addPlannerTask = (task) => api.post("/planner/tasks", task).then((r) => r.data.data);
export const togglePlannerTask = (taskId) => api.patch(`/planner/tasks/${taskId}/toggle`).then((r) => r.data.data);
export const reschedulePlannerTask = (taskId, payload) => api.patch(`/planner/tasks/${taskId}/reschedule`, payload).then((r) => r.data.data);
export const deletePlannerTask = (taskId) => api.delete(`/planner/tasks/${taskId}`).then((r) => r.data);
export const generateAdaptiveSchedule = (payload) => api.post("/planner/generate-schedule", payload).then((r) => r.data.data);
export const addCareerGoal = (payload) => api.post("/planner/goals", payload).then((r) => r.data.data);
export const addExamDeadline = (payload) => api.post("/planner/deadlines", payload).then((r) => r.data.data);
export const submitPlannerReview = (payload) => api.post("/planner/reviews", payload).then((r) => r.data.data);
