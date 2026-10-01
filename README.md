# Pre-Yeah

Branch → Role → Guidance → Beyond career platform (Student / Guide / Admin) with an AI learning layer (Groq): chat, roadmaps, quizzes, resources, progress.

Everything is ESM (`"type": "module"`) in both `backend/` and `frontend/`.

## Run
```bash
npm run install:all
cp backend/.env.example backend/.env      # fill MONGO_URI, JWT_*, GROQ_API_KEY
npm run create-admin                      # needs ADMIN_EMAIL / ADMIN_PASSWORD env vars
npm run seed:resources                    # curated resource library (replaces existing)
npm run seed:demo                         # non-production demo student + guide (never overwrites existing accounts)
npm run dev                               # API :5000, web :5173 (Vite proxies /api)
```

### Demo sign-in accounts

Run `npm run seed:demo` after configuring `MONGO_URI` for a non-production database in `backend/.env`. The seeder refuses to run when `NODE_ENV=production` and never overwrites existing accounts.

| Role | Email | Password |
|---|---|---|
| Student | `demo.student@gmail.com` | `DemoStudent123!` |
| Guide | `demo.guide@nbkrist.org` | `DemoGuide123!` |

The guide account is pre-verified and approved so the guide experience can be tested immediately. Existing accounts with these addresses are left unchanged.

## Backend layout (naming: `<name>Controller|Service|Routes|Validator.js`, models PascalCase)
| Area | Mount | Files |
|---|---|---|
| Auth + profile (student) | `/api/students` | studentController, studentRoutes, profileService |
| Guide auth + admin mgmt | `/api/guides` | guideController, guideRoutes |
| Admin auth + stats | `/api/admin` | adminController, adminRoutes |
| Roles / Branches / Beyond / Guidance / Role requests | `/api/roles` `/branches` `/beyond` `/guidance` `/role-requests` | *Controller, *Routes |
| AI chat | `/api/chat` | chatController, chatService |
| AI roadmaps | `/api/ai-roadmaps` | aiRoadmapController, aiRoadmapService |
| AI quizzes | `/api/quiz` | quizController, quizService |
| Resource library | `/api/resources` | resourceController, resourceService |
| Progress / performance | `/api/progress` `/api/performance` | progressService, performanceService |

Shared: `config/{db,groq}.js`, `services/{tokenService,groqService,roleContextService}.js`, `utils/{ApiError,ApiResponse,asyncHandler,sendEmail,aiPrompts}.js`, `middleware/{auth,validate,errorHandler,notFound,rateLimiters}.js`.

All JSON responses use `{ success, statusCode, message, data, meta? }`.

## Frontend
Services in `src/services/*Service.js` mirror the backend modules. Student-only pages (`/chat /roadmaps /quiz /progress /profile`) sit behind `ProtectedRoute`.
