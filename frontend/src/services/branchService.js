import api from "./api.js";

export function fetchBranches(params = {}) {
  return api.get("/branches", { params }).then((r) => r.data.data); // array of branch name strings
}

export function fetchGoogleOnboardingBranches(token) {
  return api.get("/students/google-onboarding/branches", {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.data.data);
}

export function fetchManagedBranches() {
  return api.get("/branches/manage").then((r) => r.data.data);
}

export function createBranch(name, domainIds = []) {
  return api.post("/branches", { name, domainIds }).then((r) => r.data.data);
}

export function updateBranchDomains(name, domainIds) {
  return api.put(`/branches/${encodeURIComponent(name)}/domains`, { domainIds }).then((r) => r.data.data);
}

export function deleteBranch(name) {
  return api.delete(`/branches/${encodeURIComponent(name)}`).then((r) => r.data);
}
