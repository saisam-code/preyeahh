import api from "./api.js";

export function getParentWards() {
  return api.get("/auth/extended/parent/wards").then((response) => response.data.data);
}

export function getParentWardDetail(studentId) {
  return api.get(`/auth/extended/parent/wards/${encodeURIComponent(studentId)}`).then((response) => response.data.data);
}

export function requestParentLink(code) {
  return api.post("/auth/extended/parent/links/request", { code }).then((response) => response.data.data);
}
