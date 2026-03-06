# SafePath

SafePath is a trauma-informed safety training game built with Next.js App Router.

## Stack

- Next.js + TypeScript + Tailwind
- Auth.js (`next-auth`) with Prisma adapter
- PostgreSQL (Prisma ORM)
- AI Safety Coach provider switch: Claude or Groq

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/safepath
AI_PROVIDER=anthropic # or groq
ANTHROPIC_API_KEY=...
GROQ_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

3. Generate Prisma client and run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the app:
```bash
npm run dev
```

## Auth and APIs

- Auth route: `/api/auth/[...nextauth]`
- Register API: `POST /api/auth/register`
- Register API (active): `POST /api/register`
- Verify email API: `POST /api/verify-email`
- Resend verification API: `POST /api/auth/resend-verification`
- AI coach API: `POST /api/coach/feedback`
- Back-compat AI route: `POST /api/auth/coach/feedback`
- Assessment submit API: `POST /api/assessments/submit`
- Assessment summary API: `GET /api/assessments/summary`
- Scenario run start API: `POST /api/scenario-runs/start`
- Scenario run event API: `POST /api/scenario-runs/event`
- Scenario run completion API: `POST /api/scenario-runs/complete`
- Role-play session start API: `POST /api/roleplay/sessions/start`
- Role-play session fetch API: `GET /api/roleplay/sessions/:id`
- Role-play turn API: `POST /api/roleplay/sessions/:id/message`
- Role-play streaming turn API: `POST /api/roleplay/sessions/:id/stream`
- Certificate API: `GET /api/certificate`
- Admin certificate verification API: `GET /api/admin/certificates/verify?code=...`
- Public certificate verification API: `GET /api/certificates/public-verify?code=...`
- Certificate QR image API: `GET /api/certificate/qr?code=...`
- Public verification page: `/verify-certificate?code=...`

Scenario score integrity:
- EQ and Confidence are verified server-side.
- Event route ignores client-provided score deltas and recomputes from scenario graph.
- Completion route recomputes final scores from verified event chain and only completes at terminal nodes.

## Email Verification

- New users are created with `emailVerified = null`.
- Signup sends a verification email with a token link to `/verify-email`.
- Credentials login is blocked until email is verified.
- If SMTP is not configured, signup/login return a dev-only `verifyUrl` fallback.

## Game Modes

- New mode-specific scenario route: `/mode/:mode/:id`
- Supported mode slugs:
  - `simulation`
  - `puzzle`
  - `role-play`
  - `strategy`
  - `story`
- Legacy scenario route still works: `/scenario/:id`
- Both routes use the same gameplay/scoring engine (`ScenarioCore`) and same scenario-run APIs.
- Dashboard scenario cards now route to mode URLs and include a mode filter tab bar.

Design system updates:
- Added reusable avatar component: `app/components/Avatar.tsx`
- Added pastel token aliases in global CSS (`--primary`, `--secondary`, `--background`, `--surface`)
- Added heading/accent utility classes:
  - `.font-heading`
  - `.font-accent`

## Testing

Unit tests (Vitest):
```bash
npm run test:unit
```

E2E tests (Playwright):
```bash
npm run test:e2e
```

The E2E suite currently covers mode route smoke flows:
- `/mode/simulation/placeholder-1`
- `/mode/puzzle/placeholder-6`
