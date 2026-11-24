export const STUDENT_EDUCATION_STAGES = [
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Intermediate",
  "Diploma",
  "Undergraduate",
  "Postgraduate",
  "PhD",
  "Research Scholar",
  "Postdoctoral Research",
  "Working Professional",
  "Independent Learner / Career Switcher",
];

export const LEGACY_EDUCATION_STAGES = [
  "Class 6-8",
  "Class 9-10",
  "Class 11-12 / Intermediate",
  "Intermediate / Class 11-12",
  "Class 11-12",
];

export const EDUCATION_STAGES = [
  ...STUDENT_EDUCATION_STAGES,
  ...LEGACY_EDUCATION_STAGES,
];

const EDUCATION_STAGE_ALIASES = new Map([
  ["Class 11-12", "Intermediate"],
  ["Class 11-12 / Intermediate", "Intermediate"],
  ["Intermediate / Class 11-12", "Intermediate"],
]);

export function normalizeEducationStage(stage) {
  if (!stage) return "Undergraduate";
  const normalized = EDUCATION_STAGE_ALIASES.get(stage) || stage;
  return EDUCATION_STAGES.includes(normalized) ? normalized : "Undergraduate";
}

export function normalizeEducationStages(stages) {
  return Array.isArray(stages)
    ? [...new Set(stages.map(normalizeEducationStage).filter(Boolean))]
    : [];
}
