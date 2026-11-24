/**
 * Education labels are shared with the backend; planner enums remain frontend-owned.
 */
export {
  EDUCATION_STAGES,
  STUDENT_EDUCATION_STAGES,
  normalizeEducationStage,
  normalizeEducationStages,
} from "../../../shared/educationStages.js";

export const TASK_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Postponed",
  "Skipped",
  "Cancelled",
];

export const TASK_CATEGORIES = [
  "Academic study",
  "Skill development",
  "Career research",
  "Career experiment",
  "Practical project",
  "Portfolio development",
  "Exam preparation",
  "Competition preparation",
  "Internship application",
  "Scholarship application",
  "Mentorship",
  "Personal activity",
  "Rest and breaks",
  "Financial planning",
];

export const TASK_PRIORITIES = ["Critical", "High", "Medium", "Low"];

export const GOAL_TYPES = [
  "Primary",
  "Alternative",
  "Exploring",
  "Temporary",
  "Long-term",
];
