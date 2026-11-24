/**
 * Phase 3 Consolidation & Data Model Regression Tests
 *
 * Tests:
 *  - 3.1: toSetFields extracts and persists educationStage, board, subjects, primaryCareerGoal
 *  - 3.2: StudentGoal schema enforces status and type enums
 *  - 3.4: Role schema has optional type and domainId reference
 *  - 3.4: CareerDomain model is registered
 *  - 3.5: Opportunity model schema matches real-world categories
 *  - 3.8: QuizResult model retains persistent aggregate score record without raw question text
 */

import { test } from "node:test";
import assert from "node:assert/strict";

test("3.2: StudentGoal model schema enforces types and statuses", async () => {
  const StudentGoal = (await import("../models/StudentGoal.js")).default;
  const typePath = StudentGoal.schema.path("type");
  assert.deepEqual(
    typePath.enumValues,
    ["PRIMARY", "ALTERNATIVE", "EXPLORING", "INTEREST"],
    "StudentGoal type enum must support PRIMARY, ALTERNATIVE, EXPLORING, INTEREST"
  );

  const statusPath = StudentGoal.schema.path("status");
  assert.equal(statusPath.defaultValue, "ACTIVE", "StudentGoal status must default to ACTIVE");
});

test("3.4: Role schema has optional type and domainId reference", async () => {
  const Role = (await import("../models/Role.js")).default;
  const typePath = Role.schema.path("type");
  assert.ok(!typePath.isRequired, "Role type must be optional (core/non-core not required for all careers)");

  const domainIdPath = Role.schema.path("domainId");
  assert.ok(domainIdPath, "Role must have domainId path");
});

test("3.4: CareerDomain model is registered in mongoose", async () => {
  const CareerDomain = (await import("../models/CareerDomain.js")).default;
  assert.ok(CareerDomain, "CareerDomain model must be exported");
  assert.ok(CareerDomain.schema.path("slug").isRequired, "CareerDomain slug must be required");
});

test("3.5: Opportunity model schema matches real-world categories", async () => {
  const { Opportunity } = await import("../models/StudentDevelopment.js");
  const catPath = Opportunity.schema.path("category");
  assert.ok(catPath.enumValues.includes("Scholarship"), "Must support Scholarship");
  assert.ok(catPath.enumValues.includes("Competition"), "Must support Competition");
  assert.ok(catPath.enumValues.includes("Internship"), "Must support Internship");
});

test("3.8: QuizResult model retains score telemetry without question text", async () => {
  const QuizResult = (await import("../models/QuizResult.js")).default;
  assert.ok(QuizResult.schema.path("score").isRequired, "Score must be required on QuizResult");
  assert.ok(QuizResult.schema.path("topic").isRequired, "Topic must be required on QuizResult");
  assert.ok(!QuizResult.schema.path("questions"), "QuizResult must NOT store ephemeral question text");
  assert.ok(!QuizResult.schema.path("userAnswers"), "QuizResult must NOT store user answers");
});

test("Education stages normalize legacy Class 11-12 values", async () => {
  const { normalizeEducationStage, normalizeEducationStages } = await import("../constants/educationStages.js");
  assert.equal(normalizeEducationStage("Class 11-12"), "Class 11-12 / Intermediate");
  assert.equal(normalizeEducationStage("Intermediate / Class 11-12"), "Class 11-12 / Intermediate");
  assert.deepEqual(
    normalizeEducationStages(["Class 11-12", "Undergraduate"]),
    ["Class 11-12 / Intermediate", "Undergraduate"]
  );
});

test("Planner and development share canonical task categories", async () => {
  const { TASK_CATEGORIES } = await import("../constants/educationStages.js");
  const PersonalCareerPlan = (await import("../models/PersonalCareerPlan.js")).default;
  const categoryEnum = PersonalCareerPlan.schema.path("tasks").schema.path("category").enumValues;
  assert.deepEqual(categoryEnum, TASK_CATEGORIES);
});

test("Student experiments retain an explicit planner task reference", async () => {
  const { StudentExperiment, StudentProject } = await import("../models/StudentDevelopment.js");
  assert.ok(StudentExperiment.schema.path("plannerTaskId"), "Experiment must reference its planner task");
  assert.ok(StudentProject.schema.path("isPublicOnPortfolio"), "Project privacy field must remain");
});
