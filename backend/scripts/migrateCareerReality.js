/**
 * Idempotent migration script for Career Reality fields.
 *
 * Converts legacy string salaryRange and demand/competition fields in Role documents
 * to the { value, kind, source } realityFactSchema format.
 * Both correctly encoded and legacy double-encoded rupee defaults are recognized so
 * existing fake salary data is cleared instead of being presented as verified reality.
 * The legacy spellings are intentional compatibility data, not user-facing copy.
 *
 * Usage:
 *   node scripts/migrateCareerReality.js [--dry-run]
 */

import "dotenv/config";
import mongoose from "mongoose";
import Role from "../models/Role.js";
import logger from "../utils/logger.js";

function toFact(val) {
  if (!val) return { value: "", kind: "UNVERIFIED", source: "" };
  if (typeof val === "string") {
    // If it was one of the fake defaults, convert to empty so "No verified data yet" renders
    const fakeDefaults = [
      "₹3.5 LPA - ₹6 LPA",
      "₹8 LPA - ₹15 LPA",
      "₹20 LPA - ₹40+ LPA",
      "\u00e2\u201a\u00b93.5 LPA - \u00e2\u201a\u00b96 LPA",
      "\u00e2\u201a\u00b98 LPA - \u00e2\u201a\u00b915 LPA",
      "\u00e2\u201a\u00b920 LPA - \u00e2\u201a\u00b940+ LPA",
      "High",
    ];
    if (fakeDefaults.includes(val.trim())) {
      return { value: "", kind: "UNVERIFIED", source: "" };
    }
    return { value: val.trim(), kind: "UNVERIFIED", source: "" };
  }
  if (typeof val === "object" && val !== null) {
    return {
      value: typeof val.value === "string" ? val.value.trim() : "",
      kind: ["VERIFIED", "ESTIMATE", "AI_GENERATED", "UNVERIFIED"].includes(val.kind) ? val.kind : "UNVERIFIED",
      source: typeof val.source === "string" ? val.source.trim() : "",
    };
  }
  return { value: "", kind: "UNVERIFIED", source: "" };
}

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/preyeah";

  logger.info(`Connecting to MongoDB... (dry-run: ${isDryRun})`);
  await mongoose.connect(mongoUri);

  const roles = await Role.find({});
  logger.info(`Found ${roles.length} roles to evaluate`);

  let updatedCount = 0;

  for (const role of roles) {
    let changed = false;
    const reality = role.reality || {};
    const salary = reality.salaryRange || {};

    const newStarting = toFact(salary.starting);
    const newMid = toFact(salary.mid);
    const newExp = toFact(salary.experienced);
    const newDemand = toFact(reality.demandLevel);
    const newComp = toFact(reality.competitionLevel);

    if (
      salary.starting?.value !== newStarting.value ||
      salary.mid?.value !== newMid.value ||
      salary.experienced?.value !== newExp.value ||
      reality.demandLevel?.value !== newDemand.value ||
      reality.competitionLevel?.value !== newComp.value
    ) {
      changed = true;
      role.reality = {
        ...reality,
        salaryRange: {
          ...salary,
          starting: newStarting,
          mid: newMid,
          experienced: newExp,
          currency: salary.currency || "INR",
        },
        demandLevel: newDemand,
        competitionLevel: newComp,
      };
    }

    if (changed) {
      updatedCount++;
      if (!isDryRun) {
        await role.save({ validateBeforeSave: false });
      }
    }
  }

  logger.info(`Migration complete: ${updatedCount} roles ${isDryRun ? "would be" : "were"} migrated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  logger.error("Migration failed:", err.message);
  process.exit(1);
});
