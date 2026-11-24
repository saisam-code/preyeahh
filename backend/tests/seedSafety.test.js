import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { assertSeedAllowed } from "../utils/seedGuard.js";

test("resource and demo seed scripts refuse production before connecting", () => {
  assert.throws(
    () => assertSeedAllowed({ NODE_ENV: "production", SEED_RESOURCES: "true" }, "SEED_RESOURCES"),
    /disabled in production/i
  );
  assert.throws(
    () => assertSeedAllowed({ NODE_ENV: "production", SEED_DEMO_ACCOUNTS: "true" }, "SEED_DEMO_ACCOUNTS"),
    /disabled in production/i
  );
});

test("seed scripts require explicit opt-in before connecting", () => {
  assert.throws(
    () => assertSeedAllowed({ NODE_ENV: "development" }, "SEED_RESOURCES"),
    /Set SEED_RESOURCES=true/
  );
  assert.throws(
    () => assertSeedAllowed({ NODE_ENV: "development" }, "SEED_DEMO_ACCOUNTS"),
    /Set SEED_DEMO_ACCOUNTS=true/
  );
  assert.doesNotThrow(() =>
    assertSeedAllowed({ NODE_ENV: "development", SEED_RESOURCES: "true" }, "SEED_RESOURCES")
  );
});

test("resource seeding upserts curated rows without deleting other records", async () => {
  const source = await readFile(new URL("../scripts/seedResources.js", import.meta.url), "utf8");
  assert.match(source, /assertSeedAllowed\(process\.env, "SEED_RESOURCES"\)/);
  assert.match(source, /Resource\.bulkWrite/);
  assert.match(source, /upsert:\s*true/);
  assert.doesNotMatch(source, /Resource\.deleteMany/);
});

test("demo passwords are supplied through environment variables", async () => {
  const source = await readFile(new URL("../scripts/seedDemoAccounts.js", import.meta.url), "utf8");
  assert.match(source, /assertSeedAllowed\(process\.env, "SEED_DEMO_ACCOUNTS"\)/);
  assert.match(source, /process\.env\.DEMO_STUDENT_PASSWORD/);
  assert.match(source, /process\.env\.DEMO_GUIDE_PASSWORD/);
  assert.doesNotMatch(source, /password:\s*["'][^"']+["']/);
});
