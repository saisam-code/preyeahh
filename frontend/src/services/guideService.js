import api from "./api";

export function fetchGuides() {
  return api.get("/guides").then((r) => r.data.data);
}

export function setGuideStatus(id, status) {
  return api.put(`/guides/${id}/status`, { status }).then((r) => r.data.data);
}

export function assignGuideRoles(id, roleNames) {
  return api.put(`/guides/${id}/roles`, { roleNames }).then((r) => r.data.data);
}

export function deleteGuide(id) {
  return api.delete(`/guides/${id}`).then((r) => r.data);
}
