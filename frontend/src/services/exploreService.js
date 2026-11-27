import api from "./api.js";

export const fetchExploreDomains = () => api.get("/explore/domains").then((response) => response.data.data);
export const fetchExploreDomain = (slug, signal) => api.get(`/explore/domains/${slug}`, { signal }).then((response) => response.data.data);
export const fetchExploreRoles = (params, signal) => api.get("/explore/roles", { params, signal }).then((response) => response.data.data);
export const fetchExploreResources = (params, signal) => api.get("/explore/resources", { params, signal }).then((response) => response.data.data);
export const fetchExploreOpportunities = (params, signal) => api.get("/explore/opportunities", { params, signal }).then((response) => response.data.data);
export const fetchExploreGovernmentJobs = (params, signal) => api.get("/explore/government-jobs", { params, signal }).then((response) => response.data.data);
