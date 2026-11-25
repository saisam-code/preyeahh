import api from "./api.js";

export function fetchBranches() {
  return api.get("/branches").then((r) => r.data.data); // array of branch name strings
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
