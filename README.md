# PREYEAHH

Career guidance and mentorship platform for students. Explore career roles across 12 domains, get an AI-built roadmap, study from curated resources, test yourself with quizzes, and talk to mentors.

Live: https://preyeahh.vercel.app

## What it does

- **Explore** engineering branches and career roles with guidance for each.
- **Roadmaps**: AI generates a step-by-step learning plan for a chosen role. Old roadmaps stay saved.
- **AI chat**: ask career or study questions. Chats auto-delete after 7 days of inactivity.
- **Quizzes**: AI-generated quizzes per topic. Auto-delete 7 days after last activity.
- **Resources**: curated, searchable learning links.
- **Source learning inventory**: career-mapped resources and build-from-scratch tutorials from [sindresorhus/awesome](https://github.com/sindresorhus/awesome) and [codecrafters-io/build-your-own-x](https://github.com/codecrafters-io/build-your-own-x).
- **Mentors**: students message guides (mentors) directly.
- **Interests and requests**: save roles you like, or request a role that is missing.

## Who uses it

| Account | Sign up | Can do |
|---|---|---|
| Student | Google OAuth (Google-verified email) | Everything above |
| Guide | Google OAuth (Google-verified email); admin approval required | Mentor students, reply to conversations |
| Parent / institution | Email + password | Parent and institution portals |

New Google students complete branch onboarding before entering the app. New Google guides submit their branch and mentoring details for admin approval. Existing verified student and guide accounts can still use password login. SMTP email features, including app-managed email verification and password-reset emails, are disabled.

## How it works

1. Student logs in. Backend issues a short-lived access token (15 min) and a refresh cookie (7 days).
2. Student picks a branch and role, then reads guidance or generates a roadmap.
3. Roadmaps, chat replies and quizzes come from the Groq AI API through the backend.
4. Student can message a guide. Both sides see the conversation.

Stack: React + Vite (frontend), Node + Express (backend), MongoDB, Groq (AI). Hosted on Vercel (frontend), Render (backend).

## Run locally

Needs Node.js 20.x or 22+, a MongoDB URI, and Google OAuth credentials (only for Google login).

```bash
git clone <repository-url>
cd preyeah-unified

# backend
cd backend
npm install
# create backend/.env (below)
npm run dev        # http://localhost:5000

# frontend (new terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

`backend/.env`:

## Deploy

**Frontend (Vercel):** build `npm run build`, output `dist`, set `VITE_API_URL=https://preyeahh.onrender.com`.

**Backend (Render):** start `npm start`. Set the same variables as above with:

```env
NODE_ENV=production
CLIENT_URL=https://preyeahh.vercel.app
GOOGLE_CALLBACK_URL=https://preyeahh.onrender.com/api/auth/google/callback
```

After deploying institution-scoped career roles for the first time, run
`npm run migrate:role-institution-scope` once from `backend/` to update the
role uniqueness index. Admins can manage platform and institution roles;
approved institutions can add and maintain roles from the Career Roles tab
in their portal.

Before enabling domain-linked role management, run
`npm run migrate:career-domains` once from `backend/`. This idempotently
synchronizes the shared 12-domain catalog and links existing roles by their
domain name, adds the required taxonomy indexes, and associates branches with
domains already used by their roles. It does not delete or rewrite unmatched
roles. Subdomains are managed within a specific domain/branch association.
The source-resource model uses stable source IDs and wheel-domain score
indexes. Production keeps Mongoose auto-indexing disabled; review index
migrations before applying them to an existing database.

## Testing

```bash
cd backend && node --test
cd frontend && npm run build && npm run lint
```

## Import external learning resources

From `backend/`, run the importer in dry-run mode first. It shallow-clones both
source repositories, parses the Awesome catalog and Build Your Own X tutorial
sections, and fetches only first-level linked Awesome lists whose parent maps
to a wheel domain.
The JSON report contains the per-item inventory, source commit SHAs, mapping
statuses, exclusions, duplicates, failed lists, and category/domain/role
coverage. Relative Markdown documentation links are resolved to their original
repository paths, while their raw targets remain available as source references;
image assets are not imported as learning resources.

```bash
cd backend
npm run import:sources -- --dry-run --report reports\source-content-coverage.json
```

Set `MONGO_URI` in `backend/.env` to compare against existing records and get
accurate add/update/duplicate counts. Dry runs never write to MongoDB. Import
the current source snapshot with:

```bash
npm run import:sources -- --allow-production --report reports\source-content-coverage.json
```

Run the same command later to update records by stable source identifiers. The
importer applies wheel-domain and relevance-score rules and omits excluded or
failed items from the inventory collection. Imported content retains its
repository/category attribution and license information. The two repository
catalogs declare CC0; linked repositories' individual licenses are not inferred
and remain marked for review. Admins can review coverage and correct mappings
in **Admin → Imported Resources**.

Preview imported-resource cleanup before applying it:

```bash
node scripts/pruneResources.js --report reports/prune.json --min-score 2
```

Review the report and per-domain counts, then apply only when the drop reasons
and backup destination are acceptable:

```bash
node scripts/pruneResources.js --apply --report reports/prune.json --min-score 2 --allow-production
```

Apply mode writes dropped imported resources to `backend/backups/` before
deleting them. Records without a source ID are not pruned. GitHub archived and
star metadata is checked through the public API when available; the report
states when checks are rate-limited or skipped. Production writes require an
explicit `--allow-production` flag.

## Troubleshooting

| Problem | Fix |
|---|---|
| Can't connect to MongoDB | Check `MONGO_URI`, DB user permissions, and Atlas IP allowlist |
| `redirect_uri_mismatch` | Callback URL in Google Cloud must match `GOOGLE_CALLBACK_URL` exactly |
| `invalid_client` | Wrong `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`. If the secret leaked, rotate it |
| Frontend can't reach backend | Check `VITE_API_URL` and that the Render service is awake |
| Google login works locally, not in prod | Check `CLIENT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CALLBACK_URL` in Render |

## Notes for contributors

- Role checks happen on the backend. Never trust a role sent by the frontend.
- Production has `autoIndex` off. Add or change indexes through a deliberate migration, not on startup.
- Chats embed messages in one document, so very long chats can hit MongoDB's 16 MB limit.


## Maintainers

PREYEAHH Development Team
