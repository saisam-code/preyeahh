import api from "./api.js";

export function createParentLinkCode() {
  return api.post("/students/parent-link-code").then((r) => r.data.data);
}

export function getStudentParentLinks() {
  return api.get("/students/parent-links").then((r) => r.data.data || []);
}

export function updateStudentParentLinkStatus(linkId, status) {
  return api.put(`/students/parent-links/${linkId}/status`, { status }).then((r) => r.data.data);
}

export function getInterestForRole(roleId) {
  return api.get(`/students/interest/${roleId}`).then((r) => r.data.data);
}

export function recordInterest(roleId, committed) {
  return api.post("/students/interest", { roleId, committed }).then((r) => r.data.data);
}

export function getStudentGoals() {
  return api.get("/students/goals").then((r) => r.data.data);
}

export function changeStudentGoal(payload) {
  return api.post("/students/goals", payload).then((r) => r.data.data);
}

// ── AI learning profile ──
export function extractProfile(text) {
  return api.post("/students/profile/extract", { text }).then((r) => r.data.data);
}

export function updatePreferences(payload) {
  return api.put("/students/profile/preferences", payload).then((r) => r.data.data);
}

export function skipOnboarding() {
  return api.post("/students/profile/skip-onboarding").then((r) => r.data.data);
}
