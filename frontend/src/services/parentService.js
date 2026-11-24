import api from "./api.js";

/** Parent auth endpoints */
export function getParentWards() {
  return api.get("/auth/extended/parent/wards").then((r) => r.data.data || []);
}

export function requestParentLink(studentEmail) {
  return api.post("/auth/extended/parent/links/request", { studentEmail }).then((r) => r.data);
}

export function getExtendedMe() {
  return api.get("/auth/extended/me").then((r) => r.data.data);
}
