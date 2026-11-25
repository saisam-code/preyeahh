import api from "./api.js";

export function fetchCareerDomains() {
  return api.get("/career-domains").then((response) => response.data.data);
}
