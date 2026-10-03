# PREYEAHH

Career guidance and mentorship platform for engineering students. Pick a branch, explore career roles, get an AI-built roadmap, study from curated resources, test yourself with quizzes, and talk to mentors.

Live: https://preyeahh.vercel.app

## What it does

- **Explore** engineering branches and career roles with guidance for each.
- **Roadmaps**: AI generates a step-by-step learning plan for a chosen role. Old roadmaps stay saved.
- **AI chat**: ask career or study questions. Chats auto-delete after 7 days of inactivity.
- **Quizzes**: AI-generated quizzes per topic. Auto-delete 7 days after last activity.
- **Resources**: curated, searchable learning links.
- **Mentors**: students message guides (mentors) directly.
- **Interests and requests**: save roles you like, or request a role that is missing.

## Who uses it

| Account | Sign up | Can do |
|---|---|---|
| Student | Email + password, or Google | Everything above |
| Guide | Email + password, must use an `@nbkrist.org` email | Mentor students, reply to conversations |


New Google students fill in a short onboarding form (branch, etc.) before they get in. Google never creates Guide accounts.

## How it works

1. Student logs in. Backend issues a short-lived access token (15 min) and a refresh cookie (7 days).
2. Student picks a branch and role, then reads guidance or generates a roadmap.
3. Roadmaps, chat replies and quizzes come from the Groq AI API through the backend.
4. Student can message a guide. Both sides see the conversation.

Stack: React + Vite (frontend), Node + Express (backend), MongoDB, Groq (AI). Hosted on Vercel (frontend), Render (backend).

## Run locally

Needs Node.js, a MongoDB URI, and Google OAuth credentials (only for Google login).

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

## Testing

```bash
cd backend && node --test
cd frontend && npm run build && npm run lint
```

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
