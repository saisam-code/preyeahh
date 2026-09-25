import api from "./api";

export function fetchGuidance(params = {}) {
  return api.get("/guidance", { params }).then((r) => r.data.data);
}

export function fetchGuidanceForRole(roleId) {
  return api.get(`/guidance/for-role/${roleId}`).then((r) => r.data.data);
}

export function createGuidance(payload) {
  return api.post("/guidance", payload).then((r) => r.data.data);
}

export function updateGuidance(id, payload) {
  return api.put(`/guidance/${id}`, payload).then((r) => r.data.data);
}

export function deleteGuidance(id) {
  return api.delete(`/guidance/${id}`).then((r) => r.data);
}
