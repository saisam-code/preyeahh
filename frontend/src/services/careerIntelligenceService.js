import api from "./api.js";

export const discoverCareers = (params = {}) => api.get("/career-intelligence/roles", { params }).then((r) => r.data.data);
export const getCareerReality = (id) => api.get(`/career-intelligence/roles/${id}/reality`).then((r) => r.data.data);
export const compareCareers = (roleIds) => api.post("/career-intelligence/compare", { roleIds }).then((r) => r.data.data);
export const analyzeCareerSwitch = (payload) => api.post("/career-intelligence/switch-analysis", payload).then((r) => r.data.data);

export const startExperiment = (payload) => api.post("/career-intelligence/experiments", payload).then((r) => r.data.data);
export const getStudentExperiments = () => api.get("/career-intelligence/experiments").then((r) => r.data.data);
export const completeExperiment = (id, payload) => api.patch(`/career-intelligence/experiments/${id}/complete`, payload).then((r) => r.data.data);

export const calculateFinancialRoi = (payload) => api.post("/career-intelligence/financial-roi", payload).then((r) => r.data.data);
export const getPublicOutcomes = () => api.get("/career-intelligence/outcomes").then((r) => r.data.data);
export const recordCareerOutcome = (payload) => api.post("/career-intelligence/outcomes", payload).then((r) => r.data.data);
export const submitReport = (payload) => api.post("/career-intelligence/report", payload).then((r) => r.data.data);
