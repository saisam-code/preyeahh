import api from "./api";

export function fetchBeyond(params = {}) {
  return api.get("/beyond", { params }).then((r) => r.data);
}

export function fetchBeyondById(id) {
  return api.get(`/beyond/${id}`).then((r) => r.data.data);
}

export function createBeyond(payload) {
  return api.post("/beyond", payload).then((r) => r.data.data);
}

export function updateBeyond(id, payload) {
  return api.put(`/beyond/${id}`, payload).then((r) => r.data.data);
}

export function deleteBeyond(id) {
  return api.delete(`/beyond/${id}`).then((r) => r.data);
}
