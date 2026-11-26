import { test } from "node:test";
import assert from "node:assert/strict";
import { Opportunity } from "../models/StudentDevelopment.js";
import { updateOpportunity } from "../controllers/studentDevelopmentController.js";
import {
  applyTrustedVerification,
  sanitizeContributorReality,
} from "../utils/verificationSecurity.js";

test("contributor career reality cannot introduce verified facts or metadata", () => {
  const reality = sanitizeContributorReality({
    salaryRange: {
      starting: { value: "₹8 LPA", kind: "VERIFIED", source: "forged" },
      mid: { value: "₹12 LPA", kind: "ESTIMATE", source: "survey" },
    },
    demandLevel: { value: "High", kind: "VERIFIED", source: "forged" },
    competitionLevel: { value: "Medium", kind: "UNVERIFIED" },
    verification: { status: "VERIFIED", verifiedBy: "forged-id", verifiedAt: "2026-01-01" },
  });

  assert.equal(reality.salaryRange.starting.kind, "UNVERIFIED");
  assert.equal(reality.salaryRange.mid.kind, "ESTIMATE");
  assert.equal(reality.demandLevel.kind, "UNVERIFIED");
  assert.equal(reality.competitionLevel.kind, "UNVERIFIED");
  assert.deepEqual(reality.verification, { status: "UNVERIFIED" });
});

test("verified metadata records the acting admin rather than client-supplied identity", () => {
  const metadata = applyTrustedVerification({
    status: "VERIFIED",
    verifiedBy: "attacker-id",
    verifiedAt: "2000-01-01",
  }, "admin-id");

  assert.equal(metadata.verifiedBy, "admin-id");
  assert.ok(metadata.verifiedAt instanceof Date);
  assert.notEqual(metadata.verifiedAt.toISOString(), "2000-01-01T00:00:00.000Z");
});

test("guide opportunity updates whitelist fields and ignore verification metadata", async () => {
  const originalFindById = Opportunity.findById;
  const opportunity = {
    title: "Original",
    verification: { status: "UNVERIFIED" },
    save: async () => {},
  };
  Opportunity.findById = async () => opportunity;

  try {
    const response = await new Promise((resolve, reject) => {
      updateOpportunity(
        {
          params: { id: "64b000000000000000000001" },
          body: {
            title: "Updated",
            role: "admin",
            verification: { status: "VERIFIED", verifiedBy: "attacker-id" },
          },
          user: { id: "guide-id", role: "guide" },
        },
        {
          status() {
            return this;
          },
          json(body) {
            resolve(body);
            return this;
          },
        },
        reject
      );
    });

    assert.equal(response.data.title, "Updated");
    assert.equal(opportunity.title, "Updated");
    assert.equal(opportunity.role, undefined);
    assert.deepEqual(opportunity.verification, { status: "UNVERIFIED" });
  } finally {
    Opportunity.findById = originalFindById;
  }
});
