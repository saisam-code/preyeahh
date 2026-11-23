import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Student from "../models/Student.js";
import Guide from "../models/Guide.js";
import Admin from "../models/Admin.js";
import Parent from "../models/Parent.js";
import { Institution, InstitutionMembership } from "../models/Institution.js";
import PersonalCareerPlan from "../models/PersonalCareerPlan.js";
import Role from "../models/Role.js";
import { StudentExperiment, CareerComparison, StudentProject, Opportunity } from "../models/StudentDevelopment.js";
import { CareerOutcome, UserReport, UserBlock, VerificationSubmission } from "../models/SafetyAndOutcomes.js";
import app from "../app.js";
import { chatCompletion, jsonCompletion } from "../services/groqService.js";

async function runAuditVerification() {
  console.log("=== PREYEAHH AUDIT VERIFICATION RUNNER ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Model Definitions & Defaults
  console.log("\n1. Testing Model Definitions & Safety Defaults...");
  const inst = new Institution({
    name: "Test Institute of Tech",
    code: "TIT01",
    contactEmail: "admin@tit.edu",
    password: "Password123!",
  });
  assert(inst.status === "PENDING", "Institution default status must be 'PENDING' (verification gate)");

  const parent = new Parent({
    name: "Test Parent",
    email: "parent@test.com",
    password: "Password123!",
  });
  assert(parent.relationship === "Guardian", "Parent default relationship must be 'Guardian' (within valid enum)");
  assert(parent.isVerified === false, "Parent default isVerified must be false");

  // 2. Groq AI integration exports
  console.log("\n2. Testing AI Service Interface...");
  assert(typeof chatCompletion === "function", "groqService exports chatCompletion");
  assert(typeof jsonCompletion === "function", "groqService exports jsonCompletion");

  // 3. Express App & Route mounting
  console.log("\n3. Testing Express App Route Stack...");
  assert(typeof app === "function", "Express app initialized cleanly");
  
  const routeStack = app._router?.stack || [];
  const mountedPrefixes = routeStack
    .filter((layer) => layer.regexp)
    .map((layer) => layer.regexp.toString());

  assert(mountedPrefixes.length > 10, `Express stack has ${mountedPrefixes.length} registered router layers`);

  // 4. PersonalCareerPlan schema validation
  console.log("\n4. Testing PersonalCareerPlan Model...");
  const fakeId = new mongoose.Types.ObjectId();
  const plan = new PersonalCareerPlan({
    student: fakeId,
    primaryCareer: "Robotics Engineer",
    weeklyHoursAvailable: 15,
    academicStage: "Undergraduate",
  });
  assert(plan.primaryCareer === "Robotics Engineer", "Career plan accepts specified primaryCareer without overriding");
  assert(plan.status === "Active", "Career plan defaults to Active status");

  // Summary
  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuditVerification().catch((err) => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
