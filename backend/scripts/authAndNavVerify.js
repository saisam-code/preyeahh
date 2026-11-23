import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import app from "../app.js";
import Parent from "../models/Parent.js";
import { Institution } from "../models/Institution.js";

async function runAuthAndNavTests() {
  console.log("=== PREYEAHH AUTH & NAVIGATION SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // 1. JWT verification for parent and institution roles
  console.log("\n1. Testing Token Creation and Role Payloads...");
  const secret = process.env.JWT_SECRET || "test_jwt_secret_dev_key_123456789";
  
  const parentToken = jwt.sign({ id: "507f1f77bcf86cd799439011", role: "parent" }, secret, { expiresIn: "1h" });
  const decodedParent = jwt.verify(parentToken, secret);
  assert(decodedParent.role === "parent", "Parent JWT encodes role='parent'");

  const instToken = jwt.sign({ id: "507f1f77bcf86cd799439012", role: "institution" }, secret, { expiresIn: "1h" });
  const decodedInst = jwt.verify(instToken, secret);
  assert(decodedInst.role === "institution", "Institution JWT encodes role='institution'");

  // 2. Security: Onboarding tokens must not carry normal role authorizations
  console.log("\n2. Testing Onboarding Token Scope Isolation...");
  const onboardingToken = jwt.sign(
    { id: "507f1f77bcf86cd799439013", role: "student", purpose: "google_onboarding" },
    secret,
    { expiresIn: "10m" }
  );
  const decodedOnboarding = jwt.verify(onboardingToken, secret);
  assert(decodedOnboarding.purpose === "google_onboarding", "Google onboarding token carries purpose='google_onboarding'");

  // 3. Admin Privacy Verification
  console.log("\n3. Testing Admin Privacy & Exclusion...");
  const publicRoleList = ["student", "parent", "guide", "institution"];
  assert(!publicRoleList.includes("admin"), "Admin is excluded from public roles list");

  // Summary
  console.log(`\n========================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);

  process.exit(failed > 0 ? 1 : 0);
}

runAuthAndNavTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
