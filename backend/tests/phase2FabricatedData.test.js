/**
 * Phase 2 Fabricated Data & Schema Regression Tests.
 *
 * Verifies:
 *  - 2.1: careerRealitySchema has no fake defaults; values default to empty with kind: UNVERIFIED.
 *  - 2.1: String values passed to reality fields are normalized to { value, kind, source }.
 *  - 2.1: Explicit { value, kind, source } structures are preserved.
 *  - 2.3: GovernmentCareer model is registered and schema allows string/number attemptsAllowed.
 *  - 2.2: Role model schema includes reality, experiments, and verification sub-schemas.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

// Import models/index.js to test central registration
await import("../models/index.js");

test("2.3: GovernmentCareer models are registered in mongoose", () => {
  assert.ok(mongoose.models.GovernmentJob, "GovernmentJob model is registered");
  assert.ok(mongoose.models.GovernmentNotification, "GovernmentNotification model is registered");
});

test("2.3: GovernmentJob attemptsAllowed accepts both numbers and strings", () => {
  const jobSchema = mongoose.models.GovernmentJob.schema;
  const generalAttempts = jobSchema.path("examination.attemptsAllowed.general");
  assert.ok(generalAttempts, "examination.attemptsAllowed.general exists in schema");

  // Create an in-memory document instance (without connecting to DB) to verify casting
  const Job = mongoose.models.GovernmentJob;
  const docWithString = new Job({
    title: "Civil Services Officer",
    slug: "civil-services-officer-test",
    category: "Civil Services & Administration",
    examination: {
      examName: "Civil Services Examination",
      conductingBody: "UPSC",
      attemptsAllowed: {
        general: "Unlimited until age 30",
        obc: "Unlimited until age 33",
      },
    },
    eligibility: {
      minimumEducation: "Graduate Degree",
    },
  });

  assert.equal(docWithString.examination.attemptsAllowed.general, "Unlimited until age 30");
  assert.equal(docWithString.examination.attemptsAllowed.obc, "Unlimited until age 33");

  const docWithNumber = new Job({
    title: "UPSC CSE Officer",
    slug: "upsc-cse-test",
    category: "Civil Services & Administration",
    examination: {
      examName: "Civil Services Examination",
      conductingBody: "UPSC",
      attemptsAllowed: {
        general: 6,
        obc: 9,
      },
    },
    eligibility: {
      minimumEducation: "Graduate Degree",
    },
  });

  assert.equal(docWithNumber.examination.attemptsAllowed.general, 6);
  assert.equal(docWithNumber.examination.attemptsAllowed.obc, 9);
});

test("2.1: careerRealitySchema has NO fake default salaries or demand levels", async () => {
  const { Role } = await import("../models/Role.js");
  const RoleModel = mongoose.models.Role;

  // New role instance with no reality specified
  const role = new RoleModel({
    title: "AI Engineer",
    branch: "CSE",
    type: "core",
  });

  const reality = role.reality;
  assert.ok(reality, "reality subdocument exists");

  // Starting salary must be empty string, NOT fake "₹3.5 LPA - ₹6 LPA"
  assert.equal(
    reality.salaryRange.starting.value,
    "",
    "Starting salary value must default to empty string"
  );
  assert.equal(
    reality.salaryRange.starting.kind,
    "UNVERIFIED",
    "Starting salary kind must default to UNVERIFIED"
  );

  // Mid salary must be empty string
  assert.equal(
    reality.salaryRange.mid.value,
    "",
    "Mid salary value must default to empty string"
  );

  // Demand level must be empty string, NOT fake "High"
  assert.equal(
    reality.demandLevel.value,
    "",
    "Demand level value must default to empty string"
  );
  assert.equal(
    reality.demandLevel.kind,
    "UNVERIFIED",
    "Demand level kind must default to UNVERIFIED"
  );

  // Competition level must be empty string, NOT fake "High"
  assert.equal(
    reality.competitionLevel.value,
    "",
    "Competition level value must default to empty string"
  );
});

test("2.1: careerRealitySchema normalizes string inputs to realityFact objects", async () => {
  const RoleModel = mongoose.models.Role;

  const role = new RoleModel({
    title: "Robotics Engineer",
    branch: "ECE",
    type: "core",
    reality: {
      salaryRange: {
        starting: "₹6 LPA - ₹9 LPA",
      },
      demandLevel: "Very High",
    },
  });

  assert.deepEqual(role.reality.salaryRange.starting.toObject(), {
    value: "₹6 LPA - ₹9 LPA",
    kind: "UNVERIFIED",
    source: "",
  });

  assert.deepEqual(role.reality.demandLevel.toObject(), {
    value: "Very High",
    kind: "UNVERIFIED",
    source: "",
  });
});

test("2.1: careerRealitySchema preserves explicit VERIFIED metadata", async () => {
  const RoleModel = mongoose.models.Role;

  const role = new RoleModel({
    title: "Embedded Systems Developer",
    branch: "ECE",
    type: "core",
    reality: {
      salaryRange: {
        starting: {
          value: "₹5 LPA - ₹8 LPA",
          kind: "VERIFIED",
          source: "Nasscom Compensation Survey 2025",
        },
      },
      demandLevel: {
        value: "High",
        kind: "ESTIMATE",
        source: "Industry hiring report",
      },
    },
  });

  assert.equal(role.reality.salaryRange.starting.value, "₹5 LPA - ₹8 LPA");
  assert.equal(role.reality.salaryRange.starting.kind, "VERIFIED");
  assert.equal(role.reality.salaryRange.starting.source, "Nasscom Compensation Survey 2025");

  assert.equal(role.reality.demandLevel.value, "High");
  assert.equal(role.reality.demandLevel.kind, "ESTIMATE");
  assert.equal(role.reality.demandLevel.source, "Industry hiring report");
});

test("2.2: Role model schema has reality, experiments, and verification fields", () => {
  const RoleModel = mongoose.models.Role;
  const schema = RoleModel.schema;

  assert.ok(schema.path("reality"), "reality path exists on Role schema");
  assert.ok(schema.path("experiments"), "experiments path exists on Role schema");
  assert.ok(schema.path("verification"), "verification path exists on Role schema");
});
