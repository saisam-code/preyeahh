import test from "node:test";
import assert from "node:assert/strict";
import { CAREER_CATALOG } from "../../shared/careerCatalog.js";
import { applySourceRelevance } from "../services/sourceImportParser.js";
import { calculateSourceRelevance, createKnownSkillSet } from "../services/sourceRelevance.js";

test("shared career catalog contains every wheel career without frontend dependencies", () => {
  assert.equal(CAREER_CATALOG.length, 12);
  assert.equal(CAREER_CATALOG.reduce((total, domain) => total + domain.careers.length, 0), 96);
  assert.ok(CAREER_CATALOG.some(({ careers }) => careers.some(({ name }) => name === "Software Engineer")));
});

test("source relevance applies wheel role, matched skill, resource-type, and BYOX bonuses", () => {
  const skills = createKnownSkillSet(["SQL"]);
  const score = calculateSourceRelevance({
    sourceRepository: "codecrafters-io/build-your-own-x",
    relatedDomains: ["tech-eng", "not-a-domain"],
    relatedRoles: ["software engineer"],
    relatedSkills: ["sql"],
    relatedTechnologies: [],
    resourceType: "tutorial",
  }, skills);
  assert.deepEqual(score.relatedDomains, ["tech-eng"]);
  assert.equal(score.score, 5);
});

test("import-time scoring excludes low-relevance items and preserves excluded inventory status", () => {
  const [lowScore, unrelated] = applySourceRelevance([
    {
      importStatus: "mapped",
      relatedDomains: ["tech-eng"],
      relatedRoles: [],
      relatedSkills: [],
      relatedTechnologies: [],
      resourceType: "article",
      sourceRepository: "sindresorhus/awesome",
    },
    {
      importStatus: "excluded",
      relatedDomains: ["invalid-domain"],
      relatedRoles: [],
      relatedSkills: [],
      relatedTechnologies: [],
      resourceType: "article",
      sourceRepository: "sindresorhus/awesome",
    },
  ]);
  assert.equal(lowScore.importStatus, "excluded");
  assert.equal(lowScore.exclusionReason, "LOW_SCORE");
  assert.equal(unrelated.importStatus, "excluded");
  assert.deepEqual(unrelated.relatedDomains, []);
});

test("off-wheel humor, music theory, personal wikis, meta-lists, and unrelated games cannot score in", () => {
  const examples = [
    { title: "Funny programming jokes", sourceCategory: "Humor", relatedRoles: ["software engineer"] },
    { title: "Music theory", sourceCategory: "Music", relatedRoles: ["sound designer"] },
    { title: "Personal wiki", sourceCategory: "Tools", relatedRoles: ["software engineer"] },
    { title: "Awesome list of awesome lists", sourceCategory: "Software", relatedRoles: ["software engineer"] },
    { title: "Game deals", sourceCategory: "Gaming", relatedRoles: ["software engineer"] },
  ];
  for (const example of examples) {
    const result = calculateSourceRelevance({
      ...example,
      relatedDomains: ["tech-eng"],
      relatedSkills: ["SQL"],
      relatedTechnologies: [],
      resourceType: "course",
      sourceRepository: "sindresorhus/awesome",
    }, createKnownSkillSet(["SQL"]));
    assert.equal(result.score, 0, example.title);
    assert.equal(result.reason, "LOW_SCORE", example.title);
  }
});

test("game resources remain relevant when mapped to a wheel game career", () => {
  const result = calculateSourceRelevance({
    relatedDomains: ["emerging-unconv"],
    relatedRoles: ["game developer"],
    relatedSkills: [],
    relatedTechnologies: [],
    resourceType: "tutorial",
    sourceRepository: "sindresorhus/awesome",
    title: "Game engine tutorial",
  });
  assert.equal(result.score, 3);
  assert.equal(result.reason, "");
});
