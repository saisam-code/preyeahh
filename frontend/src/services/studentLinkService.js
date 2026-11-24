import api from "./api.js";

/** Student ↔ parent link management */
export function getStudentParentLinks() {
  return api.get("/students/parent-links").then((r) => r.data.data || []);
}

export function updateStudentParentLinkStatus(linkId, status) {
  return api.put(`/students/parent-links/${linkId}/status`, { status }).then((r) => r.data);
}

/** Student ↔ institution association */
export function associateWithInstitution(associationCode) {
  return api.post("/students/institution-associate", { associationCode }).then((r) => r.data);
}
