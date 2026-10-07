import api from "./api.js";

export function submitRoleRequest(payload) {
  return api.post("/role-requests", payload).then((r) => r.data);
}

export function fetchRoleRequests() {
  return api.get("/role-requests").then((r) => r.data.data);
}

export function dismissRoleRequest(id) {
  return api.patch(`/role-requests/${id}/dismiss`).then((r) => r.data);
}

export function acceptRoleRequest(id, roleId) {
  return api.patch(`/role-requests/${id}/accept`, { roleId }).then((r) => r.data);
}

export function clearRoleRequests() {
  return api.delete("/role-requests").then((r) => r.data);
}

/** Student-facing: fetch accepted-but-unread notifications */
export function fetchStudentRoleNotifications() {
  return api.get("/role-requests/student-notifications").then((r) => r.data.data);
}

/** Student-facing: mark a notification as read */
export function markRoleNotificationRead(id) {
  return api.post(`/role-requests/student-notifications/${id}/read`).then((r) => r.data);
}
