# Refactoring Changelog

## 2026-11-24

### Corrected project portfolio privacy defaults

- **Files:** `backend/controllers/studentDevelopmentController.js`, `backend/tests/phase1Security.test.js`
- **Reason:** Omitted `isPublicOnPortfolio` previously became `true`, bypassing the private model default.
- **Migration impact:** Existing records are unchanged. New/updated API-created projects require explicit `true` for public sharing.
- **Tests:** Backend test suite; added privacy source regression test.
- **Verification:** Passed.

### Enforced institution membership approval

- **Files:** `backend/controllers/studentDevelopmentController.js`, `backend/tests/phase1Security.test.js`
- **Reason:** Association-code submissions could create an ACTIVE membership without institution approval.
- **Migration impact:** No existing records changed. Both association endpoints now create PENDING memberships.
- **Tests:** Backend test suite; added PENDING approval regression test.
- **Verification:** Passed.

### Normalized institution association code lookup

- **Files:** `backend/controllers/studentDevelopmentController.js`
- **Reason:** Development association used a plain associationCode field and could accept unapproved institutions.
- **Migration impact:** None. Approved institutions and hashed codes are required.
- **Tests:** Backend test suite.
- **Verification:** Passed.

### Corrected Opportunity URL field mapping

- **Files:** `backend/controllers/studentDevelopmentController.js`
- **Reason:** Controller used `url` while the schema stores `officialUrl`.
- **Migration impact:** Reads/writes preserve `officialUrl`; legacy `url` input remains accepted.
- **Tests:** Backend test suite and build.
- **Verification:** Passed.

### Started canonical career-goal synchronization

- **Files:** `backend/services/profileService.js`, `backend/controllers/plannerController.js`
- **Reason:** `StudentGoal` was registered but not used by profile or planner workflows.
- **Migration impact:** New active StudentGoal records are created or updated from preferences and planner goals. Legacy fields remain.
- **Tests:** Backend test suite.
- **Verification:** Passed; live MongoDB behavior requires manual verification.

### Added career-goal migration

- **Files:** `backend/scripts/migrateCareerGoals.js`, `backend/package.json`
- **Reason:** Existing preference and planner data need to converge safely on StudentGoal.
- **Migration impact:** Idempotently creates or updates active goal records; no legacy records are deleted.
- **Command:** `npm run migrate:career-goals --prefix backend`
- **Tests:** Script syntax/load verified as part of final backend tests.
- **Verification:** Script added; production data migration not executed.

### Reduced planner frontend lint debt

- **Files:** `frontend/src/pages/PersonalCareerPlanner.jsx`
- **Reason:** Removed unused reschedule/review imports and an unused state setter.
- **Migration impact:** None.
- **Tests:** Frontend lint.
- **Verification:** Passed with 17 remaining warnings.

### Added security regression coverage

- **Files:** `backend/tests/phase1Security.test.js`
- **Reason:** Lock verified privacy and institution approval behavior into the test suite.
- **Migration impact:** None.
- **Tests:** Backend test suite.
- **Verification:** 34 tests passed.

### Consolidated education stages

- **Date:** 2026-11-24
- **Files:** `backend/constants/educationStages.js`, `frontend/src/constants/educationStages.js`, `backend/models/Role.js`, `backend/models/GovernmentCareer.js`, `backend/models/PersonalCareerPlan.js`, `backend/models/StudentDevelopment.js`, government/onboarding/planner frontend pages
- **Reason:** Remove drift between legacy and canonical Class 11-12 values and reuse one stage normalizer.
- **Migration impact:** Additive normalization on model writes. Existing documents remain accessible until a migration is run.
- **Tests:** 37 backend tests, frontend build.
- **Verification:** Passed.

### Unified planner task categories

- **Date:** 2026-11-24
- **Files:** `backend/constants/educationStages.js`, `backend/models/PersonalCareerPlan.js`, `backend/controllers/plannerController.js`, `frontend/src/constants/educationStages.js`, `frontend/src/pages/PersonalCareerPlanner.jsx`
- **Reason:** Align schema, AI validation, and frontend category lists.
- **Migration impact:** No field removal. Existing task values remain valid.
- **Tests:** Backend schema test and frontend build.
- **Verification:** Passed.

### Linked career experiments and planner tasks

- **Date:** 2026-11-24
- **Files:** `backend/models/StudentDevelopment.js`, `backend/models/PersonalCareerPlan.js`, `backend/controllers/careerIntelligenceController.js`
- **Reason:** Replace string-only experiment/task association with explicit references.
- **Migration impact:** Additive fields. Legacy experiment tasks retain text and gain references only when started by the new controller path.
- **Tests:** Backend test suite.
- **Verification:** Passed.

### Synced role interests and government goals to StudentGoal

- **Date:** 2026-11-24
- **Files:** `backend/controllers/studentController.js`, `backend/controllers/governmentCareersController.js`
- **Reason:** Move live career-intent writes toward StudentGoal while preserving RoleInterest and planner compatibility.
- **Migration impact:** New or updated StudentGoal records. Legacy documents remain unchanged.
- **Tests:** Backend test suite.
- **Verification:** Passed.

### Shared progress aggregation for performance

- **Date:** 2026-11-24
- **Files:** `backend/services/progressService.js`, `backend/services/performanceService.js`
- **Reason:** Reuse permanent and TTL quiz aggregation instead of repeating score calculations.
- **Migration impact:** None.
- **Tests:** Backend test suite.
- **Verification:** Passed.

### Split frontend API domains

- **Date:** 2026-11-24
- **Files:** `frontend/src/services/careerIntelligenceService.js`, `frontend/src/services/plannerService.js`, `frontend/src/services/studentDevelopmentService.js`, `frontend/src/services/careerPlannerService.js`, three live pages
- **Reason:** Separate career intelligence, planning, and development API ownership.
- **Migration impact:** Compatibility re-exports preserve old imports.
- **Tests:** Frontend build and lint.
- **Verification:** Passed.
- **Follow-up:** The unused `careerPlannerService.js` compatibility facade was removed after all in-repository consumers used domain-specific services. See `REPOSITORY_OPTIMIZATION_REPORT.md`.

### Removed empty placeholder and cleaned lint debt

- **Date:** 2026-11-24
- **Files:** `backend/services/institutionAssociationService.js` deleted; admin, discovery, government, institution, roadmap, onboarding, and context files cleaned
- **Reason:** Remove an unused empty placeholder and reduce confirmed lint warnings.
- **Migration impact:** None.
- **Tests:** Frontend lint and build.
- **Verification:** Frontend has 0 errors.

### Reworked personal career planner controller

- **Date:** 2026-11-24
- **Files:** `backend/controllers/plannerController.js`
- **Reason:** Consolidate plan/task lookup and improve validation for task dates, times, durations, career goals, deadlines, reviews, and AI schedules.
- **Migration impact:** API paths and response shapes remain unchanged. Invalid previously-accepted input now returns 400 responses. AI schedules now enforce valid dates, time formats, canonical categories/priorities, and the available daily capacity without the prior 125% overload allowance.
- **Tests:** 37 backend tests, frontend lint, `node --check`.
- **Verification:** Passed.
