# SafePath Working Flow

This document explains the overall working of the SafePath website and how data moves through the system.

## 1) High-Level User Journey

1. User lands on `/` (landing page).
2. User signs up or logs in (`/signup`, `/login`).
3. Email verification is completed (credentials login is blocked until verified).
4. User enters `/dashboard`.
5. User can:
   - Start scenario training (`/scenario/[id]`)
   - Resume unfinished scenario runs
   - Use Role-Play mode (`/role-play`)
   - View progress analytics and tips
6. System stores training events in PostgreSQL and computes progress metrics.
7. Admin users are redirected to `/admin/*` and can view user/analytics data.

## 2) Authentication and Authorization

- Implemented with **Auth.js (next-auth v5)** + Prisma adapter.
- Supports:
  - Credentials login
  - Google OAuth (if env keys provided)
- Role model:
  - `USER`
  - `ADMIN`
- Admin protection:
  - `/admin/*` checks `session.user.role === 'ADMIN'`.
  - Non-admins are redirected to `/dashboard`.

## 3) Email Verification Flow

1. User registers via `POST /api/register`.
2. User is created with `emailVerified = null`.
3. Verification token link is sent by SMTP.
4. User opens `/verify-email` link.
5. `emailVerified` is updated.
6. Credentials login is then allowed.

## 4) Scenario Training Flow (Decision Graph)

### Start
- Frontend starts run via:
  - `POST /api/scenario-runs/start`
- DB record created in `ScenarioRun` with initial scores.

### During play
- For each choice:
  - Frontend calls `POST /api/scenario-runs/event`
  - Backend validates legal transition using `deriveRunState(...)`
  - Backend recomputes score transitions (server-authoritative)
  - Event stored in `ScenarioChoiceEvent`

### Completion
- Frontend calls `POST /api/scenario-runs/complete`
- Backend recomputes final state from event chain and completes only at terminal node.
- Final scores and outcome are stored in `ScenarioRun`.

### Resume
- `GET /api/scenario-runs/resume` reconstructs latest in-progress run.

## 5) Role-Play Mode Flow (AI NPC Scaffold)

### Start session
- `POST /api/roleplay/sessions/start`
- Creates `RolePlaySession` with baseline scores.

### Chat turns
- User sends message:
  - preferred: `POST /api/roleplay/sessions/:id/stream` (SSE chunked response)
  - fallback: `POST /api/roleplay/sessions/:id/message`
- Backend:
  - stores user message (`RolePlayMessage`, speaker `USER`)
  - generates NPC response using `lib/ai/roleplay.ts`
  - stores NPC reply (`RolePlayMessage`, speaker `NPC`)
  - updates session scores and may complete session

### Session fetch
- `GET /api/roleplay/sessions/:id` returns current state + transcript.

## 6) AI Layer (Coach + Role-Play NPC)

### Providers
- Controlled by env:
  - `AI_PROVIDER=anthropic` or `groq`
  - `ANTHROPIC_API_KEY`
  - `GROQ_API_KEY`

### Coach feedback
- Route: `POST /api/coach/feedback`
- Generates trauma-informed coaching text + deltas.

### Role-play NPC
- Uses `lib/ai/roleplay.ts`.
- Returns structured JSON:
  - NPC reply
  - risk/confidence/eq deltas
  - end signal + outcome

### Reliability
- If provider fails, fallback logic still returns safe usable response.

## 7) Scoring and Realism

- Shared scoring logic in `lib/scoring.ts`.
- Applied in both:
  - scenario frontend optimistic update
  - backend event validation/storage
- Confidence and EQ are calibrated to avoid unrealistic spikes.
- Summary averages are smoothed for stability in early runs.

## 8) Progress and Analytics

Main data endpoint:
- `GET /api/scenario-runs/summary`

Computed metrics include:
- completed scenarios
- avg confidence / avg EQ / avg risk
- streaks (current, best)
- trends (7-day, 30-day)
- mode/category performance insights
- scenario heatmap scores
- recent runs timeline
- achievement unlocks
- certificate readiness
- improvement goals
- practiced tip IDs

## 9) Tips Tracking

- DB-backed per user via `UserTipPractice`.
- APIs:
  - `GET /api/user/tips`
  - `POST /api/user/tips`
  - `DELETE /api/user/tips`

## 10) Theme System

- Light/Dark toggle implemented (excluding landing page).
- Theme persisted in localStorage.
- Dark mode applied through CSS variable set (`html[data-theme='dark']`).

## 11) Admin Console

- Routes:
  - `/admin/users`
  - `/admin/analytics`
- Features:
  - user stats
  - role-aware access
  - explicit logout in admin nav

## 12) Core Database Models (Current)

- `User`
- `Account`
- `Session`
- `VerificationToken`
- `Assessment`
- `ScenarioRun`
- `ScenarioChoiceEvent`
- `UserTipPractice`
- `RolePlaySession`
- `RolePlayMessage`

## 13) Important Environment Variables

- Auth:
  - `AUTH_SECRET`
  - `NEXTAUTH_URL`
- DB:
  - `DATABASE_URL`
- AI:
  - `AI_PROVIDER`
  - `ANTHROPIC_API_KEY`
  - `GROQ_API_KEY`
- Email:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `EMAIL_FROM`
- OAuth (optional):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

## 14) Operational Notes

- After Prisma schema changes:
  1. `npm run prisma:migrate`
  2. `npm run prisma:generate`
- If Prisma generate fails with EPERM on Windows:
  - stop dev server and retry.
