const REQUIRED_PROFILE_FIELDS = [
  { key: "targetRole", label: "target role", isComplete: (profile) => typeof profile.targetRole === "string" && profile.targetRole.trim().length > 0 },
  { key: "skills", label: "at least one skill", isComplete: (profile) => Array.isArray(profile.skills) && profile.skills.some((skill) => (typeof skill === "string" ? skill : skill?.name)?.trim()) },
  { key: "goals", label: "at least one goal", isComplete: (profile) => Array.isArray(profile.goals) && profile.goals.some((goal) => typeof goal === "string" && goal.trim().length > 0) },
  { key: "weeklyHoursAvailable", label: "weekly study time", isComplete: (profile) => Number(profile.weeklyHoursAvailable) > 0 },
];

export function getProfileCompleteness(profile = {}) {
  const missingFields = REQUIRED_PROFILE_FIELDS.filter((field) => !field.isComplete(profile)).map(({ key, label }) => ({ key, label }));
  return { isComplete: missingFields.length === 0, missingFields };
}
