import test from "node:test";
import assert from "node:assert/strict";
import Resource from "../models/Resource.js";
import resourceRoutes from "../routes/resourceRoutes.js";
import * as resourceService from "../services/resourceService.js";
import { protect } from "../middleware/auth.js";

test("Resource schema stores source attribution and stable mapping metadata", () => {
  for (const field of [
    "sourceRepository", "sourceListId", "sourceCategory", "sourceSubcategory", "sourceId", "sourceUrl", "sourceLicense",
    "resourceType", "relatedDomains", "relatedRoles", "relatedSkills", "relatedTechnologies", "importStatus", "score",
  ]) {
    assert.ok(Resource.schema.path(field), `Resource.${field} must exist`);
  }
  for (const field of ["thumbnail", "bookmarks", "learningObjectives", "sourceListRepository", "sourceReference"]) {
    assert.equal(Resource.schema.path(field), undefined, `Resource.${field} must be removed`);
  }
  assert.ok(Resource.schema.indexes().some(([fields, options]) => fields.sourceId === 1 && options.unique && options.sparse));
  const indexes = Resource.schema.indexes().map(([fields]) => fields);
  assert.ok(indexes.some((fields) => fields.relatedDomains === 1 && fields.score === -1));
  assert.ok(indexes.some((fields) => fields.relatedRoles === 1 && !fields.relatedDomains));
  assert.ok(!indexes.some((fields) => fields.relatedDomains && fields.relatedRoles));
});

test("resource search combines career, category, difficulty, and pagination filters", async () => {
  const expectedItems = [{ title: "Learning resource" }];
  const originalFind = Resource.find;
  const originalCount = Resource.countDocuments;
  let actualFilter;
  let actualSkip;
  let actualLimit;
  Resource.find = (filter) => {
    actualFilter = filter;
    return {
      sort() { return this; },
      skip(value) { actualSkip = value; return this; },
      limit(value) { actualLimit = value; return Promise.resolve(expectedItems); },
    };
  };
  Resource.countDocuments = async () => 31;
  try {
    const result = await resourceService.searchResources({
      query: "", technology: "rust", difficulty: "advanced", branch: "CSE", type: "practice",
      resourceType: "tutorial", role: "software engineer", skill: "database",
      domain: "tech-eng", sourceCategory: "backend", page: 2, limit: 15,
    });
    assert.deepEqual(expectedItems, result.items);
    assert.equal(result.meta.total, 31);
    assert.equal(result.meta.totalPages, 3);
    assert.equal(actualSkip, 15);
    assert.equal(actualLimit, 15);
    assert.equal(actualFilter.technology, "rust");
    assert.equal(actualFilter.type, "practice");
    assert.equal(actualFilter.resourceType, "tutorial");
    assert.equal(actualFilter.relatedRoles.toString(), "/software engineer/i");
    assert.equal(actualFilter.relatedSkills.toString(), "/database/i");
    assert.equal(actualFilter.relatedDomains, "tech-eng");
    assert.deepEqual(actualFilter.$or, [{ branches: "CSE" }, { branches: { $size: 0 } }]);
    assert.deepEqual(actualFilter.$and[0].$or.map((entry) => Object.keys(entry)[0]), ["sourceCategory", "sourceSubcategory"]);
  } finally {
    Resource.find = originalFind;
    Resource.countDocuments = originalCount;
  }
});

test("resource import coverage is admin-only and guides can edit their assigned resources", () => {
  const coverageRoute = resourceRoutes.stack.find((layer) => layer.route?.path === "/coverage")?.route;
  const updateRoute = resourceRoutes.stack.find((layer) => layer.route?.path === "/:id" && layer.route.methods.patch)?.route;
  assert.ok(coverageRoute?.methods.get);
  assert.equal(coverageRoute.stack[0].handle, protect);
  assert.equal(updateRoute.stack[0].handle, protect);
  for (const route of [coverageRoute, updateRoute]) {
    let allowed = false;
    route.stack[1].handle({ user: { role: "admin" } }, {}, () => { allowed = true; });
    assert.equal(allowed, true);
    assert.throws(() => route.stack[1].handle({ user: { role: "student" } }, {}, () => {}), /permission/i);
  }
  let guideCanEdit = false;
  updateRoute.stack[1].handle({ user: { role: "guide" } }, {}, () => { guideCanEdit = true; });
  assert.equal(guideCanEdit, true);
});

test("roadmap recommendations can match a selected role and topic skill", async () => {
  const originalFind = Resource.find;
  const related = [{ title: "Build a database", type: "practice", views: 1 }];
  let actualFilter;
  Resource.find = (filter) => {
    actualFilter = filter;
    return { limit: async () => related };
  };
  try {
    const results = await resourceService.getRecommendedResources({
      role: "Software Engineer",
      skill: "Database Systems",
      difficulty: "intermediate",
      learningStyle: "hands-on",
    });
    assert.deepEqual(results, related);
    assert.deepEqual(actualFilter.$or.map((entry) => Object.keys(entry)[0]), ["relatedRoles", "relatedSkills"]);
    assert.deepEqual(actualFilter.difficulty, { $in: ["intermediate", "all"] });
  } finally {
    Resource.find = originalFind;
  }
});
