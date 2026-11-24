import api from "./api.js";

/** Institution auth endpoints */
export function getInstitutionMembers() {
  return api.get("/auth/extended/institution/members").then((r) => r.data.data || []);
}

export function approveInstitutionMember(memberId) {
  return api.put(`/auth/extended/institution/members/${memberId}/approve`).then((r) => r.data);
}

export function removeInstitutionMember(memberId) {
  return api.put(`/auth/extended/institution/members/${memberId}/remove`).then((r) => r.data);
}

export function rotateInstitutionCode() {
  return api.post("/auth/extended/institution/rotate-code").then((r) => r.data.data);
}

export function getExtendedMe() {
  return api.get("/auth/extended/me").then((r) => r.data.data);
}
