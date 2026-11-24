/**
 * Canonical Education Stages and Planner Constants for Preyeahh
 */
export const EDUCATION_STAGES = [
  "Class 6-8",
  "Class 9-10",
  "Class 11-12 / Intermediate",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "PhD",
  "Independent Learner / Career Switcher",
];

export const normalizeEducationStage = (stage) => {
  if (!stage) return "Undergraduate";
  if (stage === "Intermediate / Class 11-12") return "Class 11-12 / Intermediate";
  if (stage === "Class 11-12") return "Class 11-12 / Intermediate";
  if (EDUCATION_STAGES.includes(stage)) return stage;
  return "Undergraduate";
};

export const normalizeEducationStages = (stages) =>
  Array.isArray(stages)
    ? [...new Set(stages.map(normalizeEducationStage).filter(Boolean))]
    : [];

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
