import api from "./api.js";

export const getStudentProjects = () => api.get("/development/projects").then((r) => r.data.data);
export const addStudentProject = (payload) => api.post("/development/projects", payload).then((r) => r.data.data);
export const listOpportunities = (params = {}) => api.get("/development/opportunities", { params }).then((r) => r.data.data);
export const listInstitutions = () => api.get("/development/institutions").then((r) => r.data.data);
export const getStudentInstitutionStatus = () => api.get("/development/institution/status").then((r) => r.data.data);
