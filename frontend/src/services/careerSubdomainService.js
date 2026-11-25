import api from "./api.js";

export function fetchCareerSubdomains(params = {}) {
  return api.get("/career-subdomains", { params }).then((response) => response.data.data);
}

export function createCareerSubdomain(payload) {
  return api.post("/career-subdomains", payload).then((response) => response.data.data);
}

export function updateCareerSubdomain(id, payload) {
  return api.put(`/career-subdomains/${id}`, payload).then((response) => response.data.data);
}

export function deleteCareerSubdomain(id) {
  return api.delete(`/career-subdomains/${id}`).then((response) => response.data);
}
