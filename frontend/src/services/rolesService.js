import api from "./api";

/**
 * @param {Object} params - { branch, type, search, page, limit }
 */
export function fetchRoles(params = {}) {
  return api.get("/roles", { params }).then((r) => r.data);
}

export function fetchRoleById(id) {
  return api.get(`/roles/${id}`).then((r) => r.data);
}

export function createRole(payload) {
  return api.post("/roles", payload).then((r) => r.data);
}

export function updateRole(id, payload) {
  return api.put(`/roles/${id}`, payload).then((r) => r.data);
}

export function deleteRole(id) {
  return api.delete(`/roles/${id}`).then((r) => r.data);
}
