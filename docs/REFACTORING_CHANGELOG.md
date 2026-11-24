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
