import api from "./api";

export function fetchBranches() {
  return api.get("/branches").then((r) => r.data.data); // array of branch name strings
}

export function createBranch(name) {
  return api.post("/branches", { name }).then((r) => r.data.data);
}

export function deleteBranch(name) {
  return api.delete(`/branches/${name}`).then((r) => r.data);
}
