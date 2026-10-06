import api from "./api.js";

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

// ── Student management ──────────────────────────────────────────────────────
export function fetchOverviewStats() {
  return api.get("/admin/overview-stats").then((r) => r.data);
}

export function fetchAllStudents(params = {}) {
  return api.get("/admin/students", { params }).then((r) => r.data);
}

export function fetchStudentById(studentId) {
  return api.get(`/admin/students/${studentId}`).then((r) => r.data);
}

export function fetchStudentChats(studentId) {
  return api.get(`/admin/students/${studentId}/chats`).then((r) => r.data);
}

export function fetchStudentChatDetail(studentId, chatId) {
  return api.get(`/admin/students/${studentId}/chats/${chatId}`).then((r) => r.data);
}

export function fetchStudentRoadmaps(studentId) {
  return api.get(`/admin/students/${studentId}/roadmaps`).then((r) => r.data);
}
