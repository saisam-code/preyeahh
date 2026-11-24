 # Consolidation Audit Report

**Date:** 2026-11-24  
**Scope:** Complete repository audit followed by small logical consolidation phases  
**Branch:** main

## 1. Original implementation

PREYEAHH is a MERN application with:

- React 19/Vite frontend
- Express/Mongoose backend
- JWT access tokens plus role-specific refresh cookies
- Student, guide, parent, institution, and admin roles
- Career discovery, AI roadmaps, chat, quizzes, planner, government careers, mentorship, institution and parent ecosystems

## 2. Architecture map

### Startup

- `backend/server.js` loads environment configuration, imports the model registry, validates environment variables, and connects MongoDB.
- `backend/app.js` configures Helmet, CORS, compression, JSON parsing, cookie parsing, MongoDB sanitization, rate limiting, route mounting, and centralized errors.
- `backend/models/index.js` explicitly registers all Mongoose models and avoids missing-schema errors.

### Authentication

- `frontend/src/context/AuthContext.jsx` owns client session state and role selection.
- `frontend/src/services/api.js` owns access-token headers and role-specific refresh flows.
- `backend/middleware/auth.js` verifies access tokens and re-fetches account documents.
- `backend/services/tokenService.js` signs access and purpose-scoped refresh/onboarding tokens.

### Major feature traces

- Career discovery: `CareerDiscovery.jsx` -> `careerIntelligenceService.js` -> `/api/career-intelligence` -> career intelligence controller -> Role/CareerIntelligence models.
- Planner: `PersonalCareerPlanner.jsx` -> `plannerService.js` -> `/api/planner` -> planner controller -> PersonalCareerPlan/StudentGoal.
- Experiments: career intelligence page/service -> career intelligence routes/controller -> StudentExperiment -> PersonalCareerPlan task reference.
- Roadmaps: MyRoadmaps/RoadmapView -> aiRoadmapService -> `/api/ai-roadmaps` -> aiRoadmapService/controller -> AIRoadmap.
- Chat: Chat page -> chatService -> `/api/chat` -> chat controller/service -> Chat plus passive profile extraction.
- Progress: Dashboard -> progressService -> `/api/progress` and `/api/performance` -> progress/performance services -> AIRoadmap/Quiz/QuizResult.
- Government careers: GovernmentCareers page -> governmentCareersService -> `/api/government-careers` -> GovernmentJob/GovernmentNotification.
- Institutions: InstitutionPortal and student development pages -> studentDevelopmentService -> institution/development routes -> Institution/InstitutionMembership.
- Parents: ParentPortal -> parentService -> extended auth routes -> Parent/ParentLink.

## 3. Model relationship map

- Student -> StudentGoal: career intent
- Student -> PersonalCareerPlan: scheduling and execution
- PersonalCareerPlan.tasks -> StudentExperiment via `relatedExperimentId`
- StudentExperiment -> planner task via `plannerTaskId`
- Role -> StudentGoal via optional `roleId`
- Role -> StudentExperiment
- Student -> StudentProject
- Student -> CareerOutcome
- CareerDomain -> Role
- Institution -> InstitutionMembership -> Student
- Parent -> ParentLink -> Student
- GovernmentJob/Notification are separate from generic Opportunity
- VerificationSubmission -> verification metadata/status workflows
- UserReport/UserBlock/AuditLog provide moderation accountability

## 4. Duplicate model findings

### P1: Career intent had multiple owners

`Student.preferences`, `PersonalCareerPlan.primaryCareer/alternativeCareer/goals`, `RoleInterest`, and `StudentGoal` all represented career intent. `StudentGoal` is now the target owner.

**Changes:**

- Profile preferences and onboarding synchronize primary, alternative, and exploring StudentGoal records.
- Role commitment updates create/abandon INTEREST goals.
- Government exam selection creates a PRIMARY StudentGoal.
- Planner goal creation synchronizes a matching StudentGoal.
- Planner reads canonical active primary/alternative goals.
- An idempotent legacy migration remains available.

`RoleInterest` remains live and meaningful for committed/discovery ranking and mentorship. It is not deleted.

### P1: Education stages drifted

Frontend and backend used both `Class 11-12` and `Intermediate / Class 11-12` in addition to the canonical `Class 11-12 / Intermediate`.

**Changes:**

- Canonical stage constants are reused by onboarding and government filters.
- Backend normalizes legacy stage arrays in Role, GovernmentCareer, Opportunity, and PersonalCareerPlan.
- Added regression tests for legacy normalization.

### P1: Planner categories drifted

PersonalCareerPlan had a separate category enum, while frontend and AI prompts used smaller lists.

**Changes:**

- `TASK_CATEGORIES` is the canonical backend constant.
- PersonalCareerPlan uses the canonical enum.
- Planner AI validation uses canonical categories and priorities.
- Frontend planner uses the canonical category list.

### P1: Experiment/task linkage was string-only

Starting an experiment inserted a task containing a note and experiment ID, but there was no reliable typed relationship.

**Changes:**

- StudentExperiment now stores `plannerTaskId`.
- PersonalCareerPlan task now stores `relatedExperimentId`.
- Completing an experiment marks the linked planner task completed.

### P2: Progress and performance repeated quiz aggregation

Progress and performance previously read overlapping Quiz/AIRoadmap data independently.

**Changes:**

- Performance now uses progress aggregation from `progressService`.
- Progress aggregation includes TTL Quiz records and permanent QuizResult records.
- Performance no longer independently invents quiz/topic calculations.

### P2: Beyond and Opportunity remain separate

Beyond is curated cross-branch opportunities or pathways with category/lifecycle fields. Opportunity is an active scholarship/competition/internship record. They serve different workflows and should remain separate.

### P2: GovernmentCareer verification metadata

Government careers use a separate government verification shape. This is legitimate because official recruitment data has recruitment-year and gazette-specific fields, but its default status should never be interpreted as independently verified by an external source. Seed data must remain reviewed against official URLs.

## 5. Duplicate frontend service findings

Before consolidation, `careerPlannerService.js` mixed:

- Career intelligence
- Experiments
- Planner
- Projects/opportunities
- Institution status
- Outcomes/ROI/reporting

**Changes:**

- Added `careerIntelligenceService.js`
- Added `plannerService.js`
- Added `studentDevelopmentService.js`
- Initially retained `careerPlannerService.js` as a compatibility re-export facade; it was later removed after confirming no remaining consumers.
- Updated three direct live pages to domain-specific imports

This preserves API contracts while establishing clear ownership.

## 6. Shared backend infrastructure

Centralized/reused infrastructure includes:

- `groqService.js` for Groq client access and chat/JSON completion
- `roleContextService.js` for role context
- `profileService.js` for profile data
- `progressService.js` for learning analytics
- `tokenService.js` for token lifecycle
- `escapeRegex.js` for safe search
- `ApiError.js`, `ApiResponse.js`, `asyncHandler.js`, `errorHandler.js`
- Shared verification metadata and career reality schemas

No generic controller abstraction was added where it would hide authorization or domain rules.

## 7. Dead-code investigation

Safe conclusions:

- `Dashboard.jsx` is live at `/dashboard` and is a legitimate analytics page.
- `CareerComparison` is live in the career intelligence controller and model.
- `rescheduleTask` and `submitReview` remain live backend routes.
- `reschedulePlannerTask` and `submitPlannerReview` are compatibility frontend functions.
- `Navbar.jsx` and `LoginModal.jsx` do not exist in the current repository.
- The empty untracked `institutionAssociationService.js` placeholder had no exports or references and was removed.
- The institution, parent, and student-link frontend services are no longer untracked and their call sites should be preserved unless domain consolidation is separately documented.

No model or live route was deleted.

## 8. Security and data integrity findings

### P0 fixed

- Student project public sharing now requires explicit `true`.
- Institution association code submissions now remain PENDING and require institution approval.
- Protected profile fields are excluded from passive AI extraction.

### P1 fixed or improved

- Education stages normalize legacy values.
- Career intent writes synchronize StudentGoal.
- Experiment/task references are explicit.
- Permanent quiz results are included in learning analytics.

### P1 remaining

- StudentGoal concurrent PRIMARY enforcement is pre-save hook based. High-concurrency strict uniqueness should use a transaction or partial unique index.
- The legacy career-goal migration is available but must be run and verified against a database copy.
- Live MongoDB integration was not available.

### P1/P2 manual verification

- Google, SMTP, Groq, and MongoDB deployment settings require real environment secrets.
- Institution approval, refresh rotation, and Google onboarding should be tested end-to-end.
- Government data requires official-source review for every displayed verification claim.

## 9. Test evidence

Baseline:

- 34 backend tests passed
- Frontend build passed
- Frontend lint had 17 warnings

Consolidation pass:

- 37 backend tests passed
- Frontend build passed
- Frontend lint has 0 errors and 17 warnings

Lint warnings remaining:

- CareerDiscovery hook dependency is intentionally split between filter-triggered and submit-triggered loading.
- GovernmentCareers effects depend on fetched array lengths.
- Some admin and onboarding unused UI variables are candidates for follow-up but do not break builds.

## 10. Files changed in this pass

Backend constants/models/controllers/services/tests:

- `backend/constants/educationStages.js`
- `backend/controllers/careerIntelligenceController.js`
- `backend/controllers/governmentCareersController.js`
- `backend/controllers/plannerController.js`
- `backend/controllers/studentController.js`
- `backend/models/GovernmentCareer.js`
- `backend/models/PersonalCareerPlan.js`
- `backend/models/Role.js`
- `backend/models/StudentDevelopment.js`
- `backend/services/performanceService.js`
- `backend/services/progressService.js`
- `backend/tests/phase3Consolidation.test.js`

Frontend:

- `frontend/src/constants/educationStages.js`
- `frontend/src/pages/StudentOnboarding.jsx`
- `frontend/src/pages/GovernmentCareers.jsx`
- `frontend/src/pages/PersonalCareerPlanner.jsx`
- `frontend/src/pages/CareerDiscovery.jsx`
- `frontend/src/pages/InstitutionPortal.jsx`
- `frontend/src/services/careerIntelligenceService.js`
- `frontend/src/services/plannerService.js`
- `frontend/src/services/studentDevelopmentService.js`
- Multiple lint cleanup files

Deleted:

- Empty untracked `backend/services/institutionAssociationService.js`

## 11. Database migration

No collection or field was dropped.

For existing career intent:

`npm run migrate:career-goals --prefix backend`

The migration is idempotent and retains legacy fields for compatibility.

For indexes:

`node scripts/syncIndexes.js`

Run only after database backup and against a database copy first.

## 12. Rollback

- Application changes are reversible with Git revert.
- Migration is additive and does not delete legacy fields or StudentGoals.
- To reverse stage normalization behavior, restore legacy constants/setters after preserving normalized values.
- Experiment references are additive and do not remove existing tasks or notes.
- No destructive database command is required.

## 13. Prioritized remaining work

### P1

- Run and verify the StudentGoal migration on a database copy.
- Complete live integration tests for refresh, Google onboarding, institution, and profile permissions.
- Add transaction/partial-index guarantees for exactly one active PRIMARY goal if concurrent writes are possible.

### P2

- Finish lint hook/unused-variable cleanup.
- Add frontend route/API integration tests.
- Split or remove the remaining compatibility careerPlanner facade after all call sites migrate.
- Add code-splitting for the 1.1 MB frontend bundle.

### P3

- Complete legal/legal-consent review TODOs.
- Add deployment environment and database migration documentation.
- Remove remaining source-map/chunk-size warnings with deliberate bundling.

## 14. Estimated maintenance reduction

- One canonical task category source
- One canonical education-stage normalizer
- One canonical career-intent model target
- Explicit experiment/task relationship
- Shared progress/performance aggregation
- Three domain-specific frontend API modules instead of one mixed career planner module
- No live functionality was deleted