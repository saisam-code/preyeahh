# Refactoring Status Report

**Date:** 2026-11-24  
**Repository:** saisam-code/preyeahh  
**Current branch:** main  
**Baseline commit:** da1e81959ffac51a667098f03a7c1c93ba71bc90

## 1. Executive summary

The application is a React/Vite frontend and Express/Mongoose backend. The repository has a substantial existing Phase 1-3 refactor, including security/privacy models, new parent and institution workflows, government career data, career intelligence schemas, and a central model registry. It is presently buildable and the backend test suite passes.

This takeover did not discard or reset existing work. The current foundation passes 39 backend tests, a frontend production build, and frontend lint. The earlier privacy and institution-approval fixes remain intact. This update adds a shared education-stage catalog, resumable student onboarding, optional non-engineering registration, and allowlisted profile persistence; it does not complete the broader PREYEAHH product specification.

## 2. Previous work reconstructed

The latest commit, `da1e819` (`rework`), introduced or materially changed:

- Parent and institution account/link workflows.
- `StudentGoal`, `CareerDomain`, `QuizResult`, `AuditLog`, and `ParentLink` models.
- Government career models, routes, seed data, and frontend usage.
- Student project, outcome, institution, and privacy behavior.
- Profile and AI consolidation services.
- Career planner and career intelligence connections.
- Additional security and consolidation tests.

Recent repository history also contains login and UI revisions, but no reliable handoff report existed.

## 3. Completed and verified

- Backend test suite: 39 tests passed, 0 failed.
- Frontend production build: passed, 807 modules transformed; existing large-chunk warning remains.
- Frontend lint: passed.
- GovernmentCareer model registration and frontend/backend route usage.
- Education-stage constants are duplicated exactly at backend and frontend constants.
- Student portfolio and career outcomes default to private in Mongoose.
- Institution and parent refresh-token versions and schemas are present.
- ParentLink defaults to PENDING and false consent.
- `CareerIntelligence`, `Role`, `GovernmentCareer`, and `StudentDevelopment` have verification metadata reuse.
- AI planner JSON is filtered against allowed categories, priorities, duration limits, and day offsets.
- Education stages now come from `shared/educationStages.js`, with legacy labels normalized at the backend and frontend boundaries.
- Student profiles support detailed school/program/location fields and retain an education-history snapshot when a completed learner changes education stage or program details.
- Student onboarding can resume from a device draft and saves authenticated progress by step; guest onboarding data is sent through registration and persisted via explicit profile-field allowlists.
- Student registration no longer assumes an engineering branch or career goal; guide branch requirements remain unchanged, and privacy-consent fields are not accepted from registration/onboarding payloads.
- Uncommitted frontend institution, parent, and student-link service files are not imported and remain candidate utilities, not repository truth.

## 4. Implemented but not verified

- `StudentGoal` synchronization for profile preference updates and AI profile extraction.
- `StudentGoal` synchronization when a planner goal is added.
- Planner API response override of primary and alternative career fields from active canonical goals.
- `migrateCareerGoals.js` idempotent legacy-data migration.

These changes compile and pass tests, but require a real MongoDB migration/run to verify document-level behavior.

## 5. Partially implemented

### Career goals

`StudentGoal` exists but legacy sources remain in `Student.preferences`, `PersonalCareerPlan.primaryCareer/alternativeCareer/goals`, and `RoleInterest`. Previous code used all of these. This work only begins the convergence; it does not remove or migrate legacy fields or add migration enforcement.

Onboarding and manual profile updates now synchronize selected primary/alternative career goals, pausing replaced goals instead of leaving them active. Discovery, roadmaps, and planner consumers still need a canonical end-to-end read path.

### Education and onboarding

The current change provides a reusable education-stage vocabulary, additive profile fields/history, resumable drafts, and guest registration persistence. It is a foundation only: there is no verified live MongoDB migration, and broader age-adaptive learning, school/parent workflows, and personalized opportunity coverage remain outstanding.

### Institution association

Both `/api/students/institution-associate` and `/api/development/institution/associate` now preserve PENDING approval semantics, and the development path validates an institution association code hash. Institution UI approval routes remain.

### Planner

The planner owns scheduling, milestones, deadlines, reviews, and embedded goal compatibility fields. `StudentExperiment` is connected to `PersonalCareerPlan.tasks`, but task completion and experiment completion are separate workflows.

## 6. Unfinished and abandoned work

- Run `npm run migrate:career-goals` against production/staging data and verify records.
- Remove or deprecate legacy career fields only after migration verification.
- Wire `StudentGoal` explicitly into CareerDiscovery and roadmap consumers rather than relying on compatibility fields.
- `RoleInterest` remains live for role discovery, mentoring, and admin ranking, so it is not currently safe to delete.
- Frontend imports `reschedulePlannerTask` and `submitPlannerReview` were unused and remain absent from page logic; the backend endpoints are present.

## 7. Broken or questionable implementations

### Fixed: portfolio privacy

`StudentDevelopment.addStudentProject` previously used `isPublicOnPortfolio !== false`, causing omitted values to become public. It now requires `isPublicOnPortfolio === true`.

### Fixed: institution approval bypass

The development institution association endpoint previously created `ACTIVE` membership directly when an association code was supplied. It now requires PENDING and institution-admin approval.

### Fixed: opportunity URL field mismatch

Opportunity creation accepted `url` while the model stores `officialUrl`. Creation/update now preserve `officialUrl` and accept legacy `url` input.

## 8. Updated architecture map

### Frontend

- React Router routes are declared in `frontend/src/App.jsx`.
- Layouts separate public, auth, student, guide, parent, institution, role, and admin experiences.
- API modules under `frontend/src/services/` communicate with the backend.
- Contexts provide auth and branch state.

### Backend

- `backend/server.js` validates environment, connects MongoDB, and imports `backend/models/index.js`.
- `backend/app.js` applies Helmet, CORS, sanitization, rate limits, routes, and centralized errors.
- Feature routes delegate to controllers.
- Controllers use Mongoose models directly or use services for profile, AI, planning, progress, and authentication.

### Core flows

- Student auth/profile: frontend auth context -> student routes -> student/extended auth controllers -> profile service -> Student model.
- Career discovery: CareerDiscovery page -> careerPlannerService -> career intelligence routes/controller -> Role/CareerIntelligence models.
- Planner: PersonalCareerPlanner -> careerPlannerService -> planner routes/controller -> PersonalCareerPlan and StudentGoal.
- Student projects: page/service -> development routes/controller -> StudentProject.
- Institution: parent/institution/student portals -> extended/student/development routes -> Institution/InstitutionMembership.

## 9. Model inventory and data ownership

| Concept | Canonical model | Legacy/related model |
|---|---|---|
| Student profile | Student.preferences | None |
| Career intent | StudentGoal (target) | Student preferences, PersonalCareerPlan, RoleInterest |
| Planner schedules/goals | PersonalCareerPlan | StudentGoal compatibility sync |
| Career role facts | Role/CareerIntelligence | Government careers reuse verification schema |
| Projects | StudentProject | None |
| Experiments | StudentExperiment | Planner task copy |
| Opportunities | Opportunity | Beyond/GovernmentCareer workflows are separate |
| Parent link | ParentLink | None |
| Institution membership | InstitutionMembership | None |
| Government careers | GovernmentJob/GovernmentNotification | PersonalCareerPlan government tracking fields |
| Quiz telemetry | QuizResult | Quiz configuration remains separate |

## 10. Duplicate models and consolidation status

- `StudentGoal` and legacy career fields are duplicated and not fully migrated.
- `RoleInterest` duplicates some career intent but also represents committed interest and live admin/mentor workflow. It should remain until a migration and API contract define replacement behavior.
- `StudentExperiment` and planner task records are intentionally linked but separate records: experiment evidence versus scheduling state.
- `CareerOutcome`, `StudentProject`, and `CareerComparison` have distinct responsibilities.

## 11. Controller, route, utility, and constants status

- Centralized model registry exists and is imported at startup.
- Centralized async handler, API response/error utilities, auth middleware, and profile service are reused.
- Education-stage constants match backend/frontend but cannot enforce compile-time sync.
- Controller-level validation is inconsistent in repeated opportunity and institution operations; no major shared CRUD abstraction is required.

## 12. Frontend duplication and reusable component status

- Role, public, auth, student, guide, parent, institution, and admin layouts are role-separated.
- Shared API modules exist, but three untracked service files are not imported and should be integrated or removed.
- Admin components remain distinct and role-specific.
- Several dead-candidate imports and state variables should be cleaned incrementally.

## 13. Dead-code investigation

No file was deleted without explicit authorization.

- `reschedulePlannerTask` and `submitPlannerReview` frontend exports are unused but backend equivalents exist.
- Untracked institution/parent/student-link services are currently unused and need an integration decision.
- `Navbar.jsx`, `LoginModal.jsx`, `Dashboard.jsx`, `CareerComparison`, and similar candidates were not assumed unused and were not removed.

## 14. Security and data-integrity findings

- P0 fixed: project public privacy default.
- P0 fixed: institution code cannot activate membership directly.
- P1: career intent remains split across multiple sources until migration is run.
- P1: StudentGoal primary supersession hook runs on save but does not protect concurrent updates performed outside save; schema should use a transaction/unique partial index for strict enforcement if concurrency is a risk.
- P1: association approval should verify institution status and membership state; current student and institution flows enforce PENDING/APPROVED in live paths.
- P2: DMDP/legal TODO remains in Student and ParentLink schemas and requires legal review.

## 15. Tests and build results

Baseline:

- 32 backend tests passed.
- Frontend build passed with one large-chunk warning.
- Frontend lint passed with 20 warnings.

Final:

- 34 backend tests passed.
- Frontend build passed.
- Frontend lint passed with 17 warnings and 0 errors.
- No database integration test or live MongoDB migration was run.

## 16. Changes made during this work

- Made student project sharing explicitly opt-in.
- Required institution approval for association-code and institution-code membership requests.
- Added a hash-validated, approved-institution lookup to the development association flow.
- Corrected Opportunity `officialUrl` handling while accepting legacy `url`.
- Added StudentGoal synchronization to profile extraction/preferences.
- Added StudentGoal synchronization to planner goal creation.
- Made planner API responses prefer canonical primary/alternative StudentGoal values.
- Added idempotent career-goal migration script.
- Added `migrate:career-goals` npm script.
- Removed two unused imports/state warnings from the personal planner.
- Added two security regression tests.

## 17. Files modified, added, and deleted

Modified:

- `backend/controllers/studentDevelopmentController.js`
- `backend/controllers/plannerController.js`
- `backend/services/profileService.js`
- `backend/package.json`
- `backend/tests/phase1Security.test.js`
- `frontend/src/pages/PersonalCareerPlanner.jsx`

Added:

- `backend/scripts/migrateCareerGoals.js`
- `docs/REFACTORING_STATUS_REPORT.md`
- `docs/REFACTORING_CHANGELOG.md`

Deleted: none.

## 18. Database migrations and compatibility

No automatic database migration runs at application startup. Run:

`npm run migrate:career-goals --prefix backend`

The script is idempotent. It creates StudentGoal records from preferences and PersonalCareerPlan while retaining legacy fields for API compatibility.

Institution membership status behavior changed at one live API: association code submissions now remain PENDING instead of ACTIVE. This is the correct security behavior and requires institution approval.

## 19. Remaining work ranked P0-P3

### P0

- None remaining from verified implementation findings.

### P1

- Run and verify the career-goal migration in MongoDB.
- Complete one canonical career-intent read/write path across discovery, roadmaps, and planner.
- Add concurrent-safe primary-goal enforcement if strong database-level guarantees are required.
- Add live integration tests for protected profile fields and institution approval.

### P2

- Resolve lint hook dependencies and unused variables.
- Integrate or remove the three untracked frontend service files.
- Clean unused frontend reschedule/review exports if no UI is planned.
- Complete opportunity URL and institution association API contract tests.
- Add frontend code-splitting for the 1.1 MB bundle.

### P3

- Complete DPDP/legal review TODOs.
- Add JSDoc or typed API contracts.
- Remove baseline Vite chunk and source-map warnings with an intentional chunk strategy.

## 20. Risks and manual verification

- MongoDB is not available in the repository test baseline, so live migration behavior is not proven here.
- Institution approval UI/API behavior should be manually verified end-to-end.
- AI schedule generation should be verified against the provider and malformed/empty JSON responses.
- Legacy `RoleInterest`, Student preferences, and PersonalCareerPlan data may disagree until migration and a canonical API are completed.
- External SMTP, OAuth, Groq, and MongoDB configuration require deployment environment secrets.

## 21. Recommended next steps

1. Run the career-goal migration in a backup/restored environment.
2. Verify StudentGoal primary/alternative records.
3. Update frontend goal consumers to read a dedicated StudentGoal API.
4. Archive legacy field writes after compatibility period.
5. Add live integration tests for institution, project privacy, and profile permissions.
