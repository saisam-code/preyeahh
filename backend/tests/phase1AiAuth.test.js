import { test } from "node:test";
import assert from "node:assert/strict";
import { validationResult } from "express-validator";
import { isGoogleEmailAllowedForRole } from "../controllers/googleAuthController.js";
import { authLimiter, aiLimiter } from "../middleware/rateLimiters.js";
import { protect, protectGoogleOnboarding } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import extendedAuthRoutes from "../routes/extendedAuthRoutes.js";
import branchRoutes from "../routes/branchRoutes.js";
import careerDomainRoutes from "../routes/careerDomainRoutes.js";
import guideRoutes from "../routes/guideRoutes.js";
import roleRoutes from "../routes/roleRoutes.js";
import studentRoutes from "../routes/studentRoutes.js";
import careerIntelligenceRoutes from "../routes/careerIntelligenceRoutes.js";
import governmentCareersRoutes from "../routes/governmentCareersRoutes.js";
import {
  analyzeCareerSwitchRules,
  calculateFinancialRoiRules,
  compareCareersRules,
  compareGovernmentJobsRules,
} from "../validators/aiRequestValidator.js";
import { googleGuideOnboardingRules } from "../validators/guideValidator.js";
import Guide from "../models/Guide.js";

function routeFor(router, path) {
  return router.stack.find((layer) => layer.route?.path === path)?.route;
}

async function validateRules(rules, body) {
  const req = { body, cookies: {} };
  await Promise.all(rules.map((rule) => rule.run(req)));
  return validationResult(req).array();
}

test("extended parent and institution register, login, and refresh routes share auth limiting and validation", () => {
  for (const [path, method] of [
    ["/parent/register", "post"],
    ["/parent/login", "post"],
    ["/parent/refresh", "post"],
    ["/institution/register", "post"],
    ["/institution/login", "post"],
    ["/institution/refresh", "post"],
  ]) {
    const route = routeFor(extendedAuthRoutes, path);
    assert.ok(route?.methods[method], `${method.toUpperCase()} ${path} must exist`);
    const handlers = route.stack.map(({ handle }) => handle);
    assert.equal(handlers[0], authLimiter, `${path} must apply the shared auth limiter`);
    assert.ok(handlers.includes(validate), `${path} must validate requests`);
    assert.ok(handlers.length > 3, `${path} must run express-validator rules`);
  }
});

test("AI career routes require authentication and use the shared AI limiter and validators", () => {
  for (const [router, path] of [
    [governmentCareersRoutes, "/compare"],
    [careerIntelligenceRoutes, "/compare"],
    [careerIntelligenceRoutes, "/switch-analysis"],
    [careerIntelligenceRoutes, "/financial-roi"],
  ]) {
    const route = routeFor(router, path);
    assert.ok(route, `POST ${path} must exist`);
    const handlers = route.stack.map(({ handle }) => handle);
    assert.equal(handlers[0], protect, `${path} must run protect first`);
    assert.equal(handlers[1], aiLimiter, `${path} must apply AI rate limiting after auth`);
    assert.ok(handlers.includes(validate), `${path} must validate its body`);
  }
});

test("catalog data routes require authentication and Google signup uses its onboarding token", () => {
  for (const [router, path] of [
    [branchRoutes, "/"],
    [careerDomainRoutes, "/"],
    [roleRoutes, "/"],
    [roleRoutes, "/:id"],
  ]) {
    const route = routeFor(router, path);
    assert.ok(route, `GET ${path} must exist`);
    assert.equal(route.stack[0].handle, protect, `GET ${path} must require authentication`);
  }

  const onboardingBranchesRoute = routeFor(studentRoutes, "/google-onboarding/branches");
  assert.ok(onboardingBranchesRoute);
  assert.ok(onboardingBranchesRoute.stack.some(({ handle }) => handle === protectGoogleOnboarding));
});

test("AI request validators cap comparison IDs, slugs, and career-switch input", async () => {
  const validIds = ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"];
  assert.deepEqual(await validateRules(compareCareersRules, { roleIds: validIds }), []);
  assert.ok((await validateRules(compareCareersRules, { roleIds: ["bad", ...validIds] })).length > 0);
  assert.deepEqual(await validateRules(compareGovernmentJobsRules, { slugs: ["teacher", "scientist"] }), []);
  assert.ok((await validateRules(compareGovernmentJobsRules, {
    slugs: Array.from({ length: 6 }, (_, index) => `job-${index}`),
  })).length > 0);
  assert.deepEqual(await validateRules(analyzeCareerSwitchRules, {
    currentCareer: "Designer",
    targetCareer: "Researcher",
    currentSkills: ["writing"],
  }), []);
  assert.ok((await validateRules(analyzeCareerSwitchRules, { targetCareer: "x".repeat(121) })).length > 0);
  assert.deepEqual(await validateRules(calculateFinancialRoiRules, { startingSalary: 50000 }), []);
  assert.ok((await validateRules(calculateFinancialRoiRules, { startingSalary: -1 })).length > 0);
});

test("student and guide signup use Google verification and guide setup is token-protected", async () => {
  assert.equal(isGoogleEmailAllowedForRole("student", "learner@another-domain.example"), true);
  assert.equal(isGoogleEmailAllowedForRole("guide", "mentor@another-domain.example"), true);
  assert.equal(isGoogleEmailAllowedForRole("guide", "not-an-email"), false);
  assert.equal(isGoogleEmailAllowedForRole("admin", "mentor@another-domain.example"), false);

  assert.equal(routeFor(studentRoutes, "/register"), undefined);
  assert.equal(routeFor(guideRoutes, "/register"), undefined);
  const onboardingRoute = routeFor(guideRoutes, "/google-onboarding");
  assert.ok(onboardingRoute);
  assert.ok(onboardingRoute.stack.some(({ handle }) => handle === protectGoogleOnboarding));

  assert.deepEqual(await validateRules(googleGuideOnboardingRules, {
    name: "Guide",
    branch: "OTHER",
    domainId: "650000000000000000000001",
    roleNames: ["Mentor"],
    bio: "",
  }), []);

  const googleGuide = new Guide({
    name: "Guide",
    email: "mentor@another-domain.example",
    googleId: "google-guide-subject",
    isVerified: true,
    googlePendingOnboarding: true,
    branch: "OTHER",
    roleNames: ["Mentor"],
  });
  assert.equal(googleGuide.validateSync(), undefined);

  const invalidEmailGuide = new Guide({
    name: "Platform Guide",
    email: "not-an-email",
    password: "example-password",
    branch: "OTHER",
  });
  assert.ok(invalidEmailGuide.validateSync()?.errors?.email);
});
