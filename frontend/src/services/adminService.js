import api from "./api";

export function loginAdmin(email, password) {
  return api.post("/admin/login", { email, password }).then((r) => r.data);
}

export function refreshAdmin() {
  return api.post("/admin/refresh").then((r) => r.data);
}

export function logoutAdmin() {
  return api.post("/admin/logout").then((r) => r.data);
}

export function forgotPasswordAdmin(email) {
  return api.post("/admin/forgot-password", { email }).then((r) => r.data);
}

export function resetPasswordAdmin(token, password) {
  return api.post("/admin/reset-password", { token, password }).then((r) => r.data);
}

export function fetchAdminMe() {
  return api.get("/admin/me").then((r) => r.data);
}

export function fetchDashboardStats() {
  return api.get("/admin/dashboard").then((r) => r.data);
}

export function fetchRoleInterest(params = {}) {
  return api.get("/admin/interest", { params }).then((r) => r.data);
}