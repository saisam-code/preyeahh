import api from "./api";

export function getInterestForRole(roleId) {
  return api.get(`/students/interest/${roleId}`).then((r) => r.data.data);
}

export function recordInterest(roleId, committed) {
  return api.post("/students/interest", { roleId, committed }).then((r) => r.data.data);
}