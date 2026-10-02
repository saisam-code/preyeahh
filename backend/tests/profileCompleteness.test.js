import test from "node:test";
import assert from "node:assert/strict";
import { getProfileCompleteness } from "../utils/profileCompleteness.js";

test("profile completion is based on required profile data, not the old onboarding flag", () => {
  const result = getProfileCompleteness({
    onboardingCompleted: false,
    targetRole: "Backend Engineer",
    skills: [{ name: "JavaScript" }],
    goals: ["Build APIs"],
    weeklyHoursAvailable: 6,
  });

  assert.equal(result.isComplete, true);
  assert.deepEqual(result.missingFields, []);
});

test("profile remains incomplete when required fields are missing or blank", () => {
  const result = getProfileCompleteness({
    onboardingCompleted: true,
    targetRole: " ",
    skills: [{ name: " " }],
    goals: [],
    weeklyHoursAvailable: 0,
  });

  assert.equal(result.isComplete, false);
  assert.deepEqual(result.missingFields.map((field) => field.key), ["targetRole", "skills", "goals", "weeklyHoursAvailable"]);
});