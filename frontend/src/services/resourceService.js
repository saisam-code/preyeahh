import api from "./api.js";

// Paginated list: returns the full body ({ data: resources[], meta })
export const searchResources = (params = {}) => api.get("/resources", { params }).then((r) => r.data);
export const fetchResource = (id) => api.get(`/resources/${id}`).then((r) => r.data.data);
export const recordResourceView = (id) => api.patch(`/resources/${id}/view`).then((r) => r.data);
export const createResource = (payload) => api.post("/resources", payload).then((r) => r.data.data);
export const updateResource = (id, payload) => api.patch(`/resources/${id}`, payload).then((r) => r.data.data);
export const fetchResourceCoverage = () => api.get("/resources/coverage").then((r) => r.data.data);
export const deleteResource = (id) => api.delete(`/resources/${id}`).then((r) => r.data);
