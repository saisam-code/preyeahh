import api from "./api.js";

/** Parent auth endpoints */
export function getParentWards() {
  return api.get("/auth/extended/parent/wards").then((r) => r.data.data || []);
}

export function getParentWardDetail(studentId) {
  return api.get(`/auth/extended/parent/wards/${studentId}`).then((r) => r.data.data);
}

export function requestParentLink(studentCode) {
  return api.post("/auth/extended/parent/links/request", { studentCode }).then((r) => r.data);
}

export function getExtendedMe() {
  return api.get("/auth/extended/me").then((r) => r.data.data);
}
