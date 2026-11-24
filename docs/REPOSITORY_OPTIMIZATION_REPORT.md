# Repository Optimization Report

## Summary

This cleanup focused on reducing misleading or unused code and making data seeding safer without removing live API routes or modifying persisted data.

| Measure | Before | Current worktree |
|---|---:|---:|
| Files | 250 tracked | 248 present |
| Source files | — | 229 |
| Source lines | 33,554 | 32,464 |

Source counts include `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.css`, and `.html` files. The current count includes tracked files present in the worktree and non-ignored untracked files. The current worktree has two fewer files and 1,090 fewer source lines than the baseline.

## Changes

- Removed automatic insertion of static government-career samples from API reads and deleted the associated sample dataset. Government career endpoints now return only persisted records.
- Made resource and demo-account seeding opt-in and disabled both in production. Resource seeding now upserts curated rows by URL instead of deleting existing resources. Demo-account passwords must be supplied through environment variables.
- Added seed-safety regression tests and protection against government sample auto-seeding returning.
- Removed unused frontend `careerPlannerService.js` and `studentLinkService.js` after confirming no in-repository imports. Existing API routes were retained.
- Removed the unused root `dotenv` dependency; the backend continues to declare its own dependency.
- Removed the empty VS Code settings file and generated prompt-extraction file. `.vscode/` is now ignored. The root logo duplicate was restored; the frontend asset remains the one used by the app.
- Updated government-career empty states and corrected onboarding registration so partial onboarding is not marked complete.

## Data and seed classification

- **Government career sample data:** unverified static examples; deleted from the repository and no longer inserted during reads.
- **Resource seed data:** retained as curated starter content; use requires `SEED_RESOURCES=true`, and production execution is refused. Upserts preserve unrelated/user-created records.
- **Demo accounts:** retained for explicit non-production setup; use requires `SEED_DEMO_ACCOUNTS=true` and environment-provided passwords. Production execution is refused.
- No production database was accessed. Existing government-career records, if any, were not inspected, verified, or deleted.

## Behavior and compatibility

When no government-career records exist, the API now returns an empty result rather than creating sample jobs or notifications. The frontend displays an honest empty state. External consumers may have depended on the removed frontend service files, although no in-repository imports were found; backend API routes remain available.

## Validation

- Backend: 44 tests passed, 0 failed.
- Frontend production build: passed; 807 modules transformed. The existing large JavaScript chunk warning (~1.14 MB) remains.
- Frontend lint: passed.
- Backend syntax checks and `git diff --check`: passed.

Final validation was run after the service-file removals: all 44 backend tests passed, and the frontend build and lint completed successfully.

## Remaining risks and follow-up

- Previously persisted government-career records were left untouched and may still need review against official sources. No verified ingestion or admin review workflow was added.
- Removing the frontend compatibility files may affect consumers outside this repository.
- The frontend build still reports a large-chunk warning.
- The initial dependency audit findings were addressed in a follow-up hardening pass. Current npm audits report zero vulnerabilities across the root, backend, and frontend packages.
- The backend now requires Node.js 20.x or 22+ to use patched Nodemailer and minimatch releases.
- Cleanup, security, encoding, and dependency-hardening changes are recorded in separate commits.
