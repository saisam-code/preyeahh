import api from "./api.js";

// Career Intelligence
export const discoverCareers = (params = {}) => api.get("/career-intelligence/roles", { params }).then((r) => r.data.data);
export const getCareerReality = (id) => api.get(`/career-intelligence/roles/${id}/reality`).then((r) => r.data.data);
export const compareCareers = (roleIds) => api.post("/career-intelligence/compare", { roleIds }).then((r) => r.data.data);
export const analyzeCareerSwitch = (payload) => api.post("/career-intelligence/switch-analysis", payload).then((r) => r.data.data);

// Experiments
export const startExperiment = (payload) => api.post("/career-intelligence/experiments", payload).then((r) => r.data.data);
export const getStudentExperiments = () => api.get("/career-intelligence/experiments").then((r) => r.data.data);
export const completeExperiment = (id, payload) => api.patch(`/career-intelligence/experiments/${id}/complete`, payload).then((r) => r.data.data);

// Personal Career Planner
export const getStudentPlan = () => api.get("/planner").then((r) => r.data.data);
export const addPlannerTask = (task) => api.post("/planner/tasks", task).then((r) => r.data.data);
export const togglePlannerTask = (taskId) => api.patch(`/planner/tasks/${taskId}/toggle`).then((r) => r.data.data);
export const reschedulePlannerTask = (taskId, payload) => api.patch(`/planner/tasks/${taskId}/reschedule`, payload).then((r) => r.data.data);
export const deletePlannerTask = (taskId) => api.delete(`/planner/tasks/${taskId}`).then((r) => r.data);
export const generateAdaptiveSchedule = (payload) => api.post("/planner/generate-schedule", payload).then((r) => r.data.data);

// Student Development (Projects & Opportunities)
export const getStudentProjects = () => api.get("/development/projects").then((r) => r.data.data);
export const addStudentProject = (payload) => api.post("/development/projects", payload).then((r) => r.data.data);
export const listOpportunities = (params = {}) => api.get("/development/opportunities", { params }).then((r) => r.data.data);
export const listInstitutions = () => api.get("/development/institutions").then((r) => r.data.data);
export const getStudentInstitutionStatus = () => api.get("/development/institution/status").then((r) => r.data.data);
export const requestInstitutionAssociation = (payload) => api.post("/development/institution/associate", payload).then((r) => r.data.data);
