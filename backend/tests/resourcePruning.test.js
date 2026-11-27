import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyImportedResource,
  canonicalResourceUrl,
  repositoryMetadataIsComplete,
  stableSourceListMappedCount,
} from "../services/resourcePruning.js";
import { createKnownSkillSet } from "../services/sourceRelevance.js";

const skillSet = createKnownSkillSet(["SQL", "Cloud Security"]);
const baseResource = {
  importStatus: "mapped",
  relatedDomains: ["tech-eng", "not-a-wheel-domain"],
  relatedRoles: ["software engineer"],
  relatedSkills: ["SQL", "sql", "unmatched"],
  relatedTechnologies: ["cloud security"],
  resourceType: "article",
  sourceRepository: "sindresorhus/awesome",
  url: "https://example.com/guide#section",
};

test("keeps relevant imported resources and normalizes wheel mappings", () => {
  const result = classifyImportedResource(baseResource, { skillSet, minScore: 2 });
  assert.equal(result.keep, true);
  assert.equal(result.score, 4);
  assert.deepEqual(result.normalized.relatedDomains, ["tech-eng"]);
  assert.deepEqual(result.normalized.relatedSkills, ["sql", "unmatched"]);
  assert.equal(result.normalized.url, "https://example.com/guide");
});

test("reports the required drop reasons for status, domain, score, and URL failures", () => {
  assert.equal(classifyImportedResource({ ...baseResource, importStatus: "duplicate" }, { skillSet }).reason, "NOT_MAPPED");
  assert.equal(classifyImportedResource({ ...baseResource, relatedDomains: ["outside"] }, { skillSet }).reason, "NO_DOMAIN");
  assert.equal(classifyImportedResource({ ...baseResource, relatedRoles: [], relatedSkills: [], relatedTechnologies: [], resourceType: "article" }, { skillSet }).reason, "LOW_SCORE");
  assert.equal(classifyImportedResource({ ...baseResource, url: "javascript:alert(1)" }, { skillSet }).reason, "BAD_URL");
});

test("rejects images and Awesome self references but accepts ordinary HTTP(S) links", () => {
  assert.equal(canonicalResourceUrl("https://example.com/logo.svg"), null);
  assert.equal(canonicalResourceUrl("https://github.com/sindresorhus/awesome#readme"), null);
  assert.equal(canonicalResourceUrl("https://example.com/path"), "https://example.com/path");
});

test("preserves the original mapped count when duplicate pruning reduces observed list rows", () => {
  assert.equal(stableSourceListMappedCount(3, 2), 3);
  assert.equal(stableSourceListMappedCount(2, 4), 4);
});

test("enforces optional repository metadata only when every list was checked", () => {
  assert.equal(repositoryMetadataIsComplete("checked 12 repositories"), true);
  assert.equal(repositoryMetadataIsComplete("partial: rate-limited after 12 repositories"), false);
  assert.equal(repositoryMetadataIsComplete("no nested source lists to verify"), false);
});
