/**
 * Phase 1 Extended Security & Access Control Tests
 *
 * Tests:
 *  - 1.3: ParentLink schema defaults to PENDING status and false parental consent
 *  - 1.4: Institution defaults to PENDING status; association code rotation generates valid hash
 *  - 1.5: Parent and Institution schemas include refreshTokenVersion for token rotation
 *  - 1.12: Student schema includes ageBand and optional branch
 *  - 1.13: AuditLog schema enforces required reason and target fields
 */

import { test } from "node:test";
import assert from "node:assert/strict";

test("1.3: ParentLink schema defaults to PENDING status and false consent", async () => {
  const ParentLink = (await import("../models/ParentLink.js")).default;
  const statusPath = ParentLink.schema.path("status");
  assert.equal(statusPath.defaultValue, "PENDING", "ParentLink status must default to PENDING");

  const consentPath = ParentLink.schema.path("parentalConsentGranted");
  assert.equal(consentPath.defaultValue, false, "Parental consent must default to false");
});

test("1.4: Institution schema defaults to PENDING status", async () => {
  const { Institution } = await import("../models/Institution.js");
  const statusPath = Institution.schema.path("status");
  assert.equal(statusPath.defaultValue, "PENDING", "Institution status must default to PENDING");
});

test("1.4: Institution rotateAssociationCode generates uppercase code and hash", async () => {
  const { Institution } = await import("../models/Institution.js");
  const inst = new Institution({
    name: "Test Institute of Technology",
    code: "TIT",
    contactEmail: "admin@tit.edu",
    password: "Password123!",
  });

  const rawCode = inst.rotateAssociationCode();
  assert.ok(rawCode.startsWith("TIT-"), "Code should start with institution code prefix");
  assert.equal(rawCode, rawCode.toUpperCase(), "Association code must be uppercase");
  assert.ok(inst.associationCodeHash, "associationCodeHash must be computed");
  assert.equal(inst.associationCodeHash.length, 64, "SHA-256 hash must be 64 characters");
});

test("1.5: Parent and Institution have refreshTokenVersion defaulting to 0", async () => {
  const Parent = (await import("../models/Parent.js")).default;
  const { Institution } = await import("../models/Institution.js");

  const parentVersion = Parent.schema.path("refreshTokenVersion");
  assert.equal(parentVersion.defaultValue, 0, "Parent refreshTokenVersion must default to 0");

  const instVersion = Institution.schema.path("refreshTokenVersion");
  assert.equal(instVersion.defaultValue, 0, "Institution refreshTokenVersion must default to 0");
});

test("1.12: Student schema includes ageBand and optional branch", async () => {
  const Student = (await import("../models/Student.js")).default;
  const ageBand = Student.schema.path("ageBand");
  assert.equal(ageBand.defaultValue, "18_PLUS", "ageBand must default to 18_PLUS");

  const branchPath = Student.schema.path("branch");
  assert.ok(!branchPath.isRequired, "Student branch must be optional");
});

test("1.13: AuditLog schema enforces required audit reason", async () => {
  const AuditLog = (await import("../models/AuditLog.js")).default;
  const reasonPath = AuditLog.schema.path("reason");
  assert.ok(reasonPath.isRequired, "AuditLog must require reason");
});
