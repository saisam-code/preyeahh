import api from "./api.js";

export const getGovernmentJobs = (params = {}) =>
  api.get("/government-careers/jobs", { params }).then((res) => res.data.data);

export const getGovernmentJobBySlug = (slug) =>
  api.get(`/government-careers/jobs/${slug}`).then((res) => res.data.data);

export const getGovernmentExams = (params = {}) =>
  api.get("/government-careers/exams", { params }).then((res) => res.data.data);

export const getGovernmentNotifications = (params = {}) =>
  api.get("/government-careers/notifications", { params }).then((res) => res.data.data);

export const compareGovernmentJobs = (slugs) =>
  api.post("/government-careers/compare", { slugs }).then((res) => res.data.data);

export const addExamToPlanner = (jobSlug, targetExamDate) =>
  api.post("/government-careers/add-to-planner", { jobSlug, targetExamDate }).then((res) => res.data.data);
