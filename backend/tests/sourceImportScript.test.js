import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(backendDirectory, "scripts", "importSourceResources.js");

test("production source imports require an explicit opt-in before cloning or writing", () => {
  let error;
  try {
    execFileSync(process.execPath, [scriptPath], {
      cwd: backendDirectory,
      env: { ...process.env, NODE_ENV: "production", MONGO_URI: "" },
      stdio: "pipe",
    });
  } catch (caught) {
    error = caught;
  }

  assert.ok(error);
  assert.equal(error.status, 1);
  assert.match(`${error.stdout.toString()}${error.stderr.toString()}`, /Production imports require the explicit --allow-production option/);
});
