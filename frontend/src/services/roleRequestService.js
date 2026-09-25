import api from "./api";

export function submitRoleRequest(payload) {
  return api.post("/role-requests", payload).then((r) => r.data);
}

export function fetchRoleRequests() {
  return api.get("/role-requests").then((r) => r.data.data);
}

export function dismissRoleRequest(id) {
  return api.patch(`/role-requests/${id}/dismiss`).then((r) => r.data);
}

export function clearRoleRequests() {
  return api.delete("/role-requests").then((r) => r.data);
}
