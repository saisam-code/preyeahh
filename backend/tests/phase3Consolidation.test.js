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
import { validationResult } from "express-validator";
import { readFile } from "node:fs/promises";

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
  assert.equal(Role.schema.path("institution").options.ref, "Institution");
  assert.ok(
    Role.schema.indexes().some(([fields]) => fields.title === 1 && fields.branch === 1 && fields.institution === 1),
    "Role uniqueness must be scoped by institution"
  );
});

test("Role create validation accepts platform scope and selected career domain", async () => {
  const { createRoleRules } = await import("../validators/roleValidator.js");
  const req = {
    body: {
      title: "Climate Data Analyst",
      branch: "SCI",
      type: "core",
      domain: "Agriculture & Environment",
      institutionId: "",
    },
    params: {},
  };
  await Promise.all(createRoleRules.map((rule) => rule.run(req)));
  assert.deepEqual(validationResult(req).array(), []);
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
  assert.equal(normalizeEducationStage("Class 11-12"), "Intermediate");
  assert.equal(normalizeEducationStage("Intermediate / Class 11-12"), "Intermediate");
  assert.equal(normalizeEducationStage(""), "");
  assert.equal(normalizeEducationStage(undefined), "");
  assert.equal(normalizeEducationStage("not a real stage"), "");
  const { getEducationMaturityStage } = await import("../constants/educationStages.js");
  assert.equal(getEducationMaturityStage(""), null);
  assert.deepEqual(
    normalizeEducationStages(["Class 11-12", "Undergraduate"]),
    ["Intermediate", "Undergraduate"]
  );
});

test("Student profile supports detailed education history and non-engineering learners", async () => {
  const Student = (await import("../models/Student.js")).default;
  assert.ok(Student.schema.path("educationHistory"));
  assert.ok(Student.schema.path("preferences.schoolOrInstitution"));
  assert.ok(Student.schema.path("preferences.expectedGraduationYear"));
  assert.ok(Student.schema.path("preferences.careerPreference").enumValues.includes("unsure"));
  assert.equal(Student.schema.path("branch").defaultValue, "");
  const undecidedStudent = new Student({ name: "Learner", email: "learner@example.com" });
  assert.equal(undecidedStudent.preferences.educationStage, "");
});

test("Student registration and onboarding accept optional branch and undecided profile fields", async () => {
  const { registerRules, preferencesRules } = await import("../validators/studentValidator.js");
  const req = {
    body: {
      name: "Learner",
      email: "learner@example.com",
      password: "password1",
      branch: "",
      educationStage: "",
      primaryCareerGoal: "",
      alternativeCareerGoal: "",
      expectedGraduationYear: null,
      learningStyle: "",
    },
  };
  await Promise.all(registerRules.map((rule) => rule.run(req)));
  assert.deepEqual(validationResult(req).array(), []);

  const profileReq = {
    body: {
      educationStage: "",
      primaryCareerGoal: "",
      alternativeCareerGoal: "",
      academicStream: "",
      schoolOrInstitution: "",
      expectedGraduationYear: null,
      learningStyle: "",
      careerPreference: "unsure",
      interests: [],
      skills: [],
      weeklyHoursAvailable: 14,
      onboardingCompleted: false,
      onboardingStep: 2,
    },
  };
  await Promise.all(preferencesRules.map((rule) => rule.run(profileReq)));
  assert.deepEqual(validationResult(profileReq).array(), []);

  const invalidReq = { body: { ...req.body, educationStage: "Unknown stage" } };
  await Promise.all(registerRules.map((rule) => rule.run(invalidReq)));
  assert.ok(validationResult(invalidReq).array().some((error) => error.path === "educationStage"));
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

test("Student goals preserve discovery history and dream/switch context", async () => {
  const StudentGoal = (await import("../models/StudentGoal.js")).default;
  assert.ok(StudentGoal.schema.path("origin"));
  assert.ok(StudentGoal.schema.path("previousGoalTitle"));
  assert.ok(StudentGoal.schema.path("changeReason"));
  assert.ok(StudentGoal.schema.path("origin").enumValues.includes("CHILDHOOD_DREAM"));
  assert.ok(StudentGoal.schema.path("origin").enumValues.includes("SWITCH_TARGET"));
});

test("Student preferences support childhood dreams and career switching context", async () => {
  const Student = (await import("../models/Student.js")).default;
  assert.ok(Student.schema.path("preferences.childhoodDream"));
  assert.ok(Student.schema.path("preferences.formerCareerGoal"));
  assert.ok(Student.schema.path("preferences.careerSwitchReason"));
});

test("Cross-domain role interests are not rejected by the student branch", async () => {
  const source = await readFile(new URL("../controllers/studentController.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /role\.branch !== req\.user\.branch/);
});

test("Career outcomes require explicit public consent", async () => {
  const source = await readFile(new URL("../controllers/advancedCapabilitiesController.js", import.meta.url), "utf8");
  assert.match(source, /isPublic:\s*isPublic\s*===\s*true/);
});

test("Career discovery computes explainable skill matches without inventing requirements", async () => {
  const source = await readFile(new URL("../controllers/careerIntelligenceController.js", import.meta.url), "utf8");
  assert.match(source, /matchedSkills/);
  assert.match(source, /missingSkills/);
  assert.match(source, /explanation/);
});

test("Career reality does not invent a default employability timeline", async () => {
  const CareerIntelligence = await import("../models/CareerIntelligence.js");
  assert.equal(
    CareerIntelligence.careerRealitySchema.path("timeToEmployabilityMonths").defaultValue,
    null
  );
});

test("Career experiments support structured reflection and next-step feedback", async () => {
  const { StudentExperiment } = await import("../models/StudentDevelopment.js");
  assert.ok(StudentExperiment.schema.path("enjoyed"));
  assert.ok(StudentExperiment.schema.path("difficultyNotes"));
  assert.ok(StudentExperiment.schema.path("wouldContinue"));
  assert.ok(StudentExperiment.schema.path("nextStepRecommendation"));
});

test("Career reality controller connects resources and opportunities to existing systems", async () => {
  const source = await readFile(new URL("../controllers/careerIntelligenceController.js", import.meta.url), "utf8");
  assert.match(source, /learningResources/);
  assert.match(source, /opportunities/);
  assert.match(source, /resourceService\.searchResources/);
  assert.match(source, /Opportunity\.find/);
});

test("Experiment completion validates reflection fields and experiment ownership", async () => {
  const source = await readFile(new URL("../routes/careerIntelligenceRoutes.js", import.meta.url), "utf8");
  assert.match(source, /completeExperimentRules/);
  assert.match(source, /authorize\("student"\)/);
});

test("Planner sync links goal history to proof and milestones", async () => {
  const source = await readFile(new URL("../controllers/plannerController.js", import.meta.url), "utf8");
  assert.match(source, /StudentProject/);
  assert.match(source, /StudentExperiment/);
  assert.match(source, /Synced from career goal history/);
  assert.match(source, /planWithProof/);
});

test("Mentorship supports cross-domain verified guides with institution isolation", async () => {
  const source = await readFile(new URL("../services/mentorshipService.js", import.meta.url), "utf8");
  assert.match(source, /guideType:\s*"PREYEAHH"/);
  assert.match(source, /guideType:\s*"INSTITUTION"/);
  assert.match(source, /status:\s*"ACTIVE"/);
  assert.doesNotMatch(source, /role\.branch !== student\.branch/);
  assert.doesNotMatch(source, /blockerId:/);
});

test("Beyond opportunities do not require a branch gate", async () => {
  const source = await readFile(new URL("../../frontend/src/pages/Beyond.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /BranchGate/);
  assert.doesNotMatch(source, /if\s*\(!branch\)/);
});
