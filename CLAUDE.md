# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Install dependencies**
  ```bash
  npm install
  ```
- **Run the development server** (Next.js App Router)
  ```bash
  npm run dev
  ```
- **Build for production**
  ```bash
  npm run build
  ```
- **Start a production build**
  ```bash
  npm start
  ```
- **Run linting**
  ```bash
  npm run lint
  ```
- **Generate Prisma client**
  ```bash
  npm run prisma:generate
  ```
- **Run Prisma migrations**
  ```bash
  npm run prisma:migrate
  ```
- **Run a single page / component** (use the `--` flag with `next dev` if you need a specific route, e.g.)
  ```bash
  npm run dev -- -p /login
  ```

## High‑Level Architecture

- **Framework**: Next.js (v16) using the **App Router** (`app/` directory). All UI pages and server actions live under `app/`.
- **API Layer**: REST‑style API routes are defined under `app/api/…/route.ts`. These handle authentication, email verification, scenario runs, and AI coach feedback.
- **Authentication**: Implemented with **next‑auth** (v5) using a **Prisma adapter**. Supports Google OAuth (`next-auth/providers/google`) and credential‑based login. Session data is stored in JWTs and enriched with user role and anonymity flags.
- **Database**: PostgreSQL accessed via **Prisma** (`@prisma/client`). The singleton Prisma client is defined in `lib/db.ts`. Migrations are managed with the Prisma CLI (`prisma:migrate`).
- **Email Verification**: Tokens are created (`lib/verification.ts`) and sent using **nodemailer**. Verification endpoint (`app/verify-email/page.tsx`) updates the user record.
- **AI Safety Coach**: Core logic in `lib/ai/coach.ts`. It picks a provider (`anthropic` or `groq`) based on `AI_PROVIDER` env var, builds a system prompt, calls the remote API, and falls back to predefined responses.
- **Scenario Data**: Static scenario definitions live in `lib/scenarios.ts`. Each scenario includes nodes, choices, risk/equity impact, and optional AI coach hints.
- **Styling**: Tailwind CSS (`tailwindcss` & `@tailwindcss/postcss`). Global styles are in `app/globals.css` and component‑scoped styles via Tailwind classes.
- **State Management**: Simple client‑side state (e.g., current scenario progress) uses **zustand**.
- **Environment**: Configuration values are read from `.env.local` (e.g., `NEXTAUTH_URL`, `DATABASE_URL`, `SMTP_*`, `AI_PROVIDER`, API keys). The `README.md` lists required variables.

## Important Files & Directories

- `app/` – Next.js pages, layouts, and API routes. Includes admin UI (`app/admin`), dashboard (`app/dashboard`), role‑play flow (`app/role-play`), safe‑exit page (`app/safe-exit`), certificate handling (`app/certificate`, `app/verify-certificate`), scenario pages (`app/scenario/[id]`), and global styles.
- `app/api/` – REST‑style endpoints covering authentication (`auth/*`), email verification, coach feedback, user registration, scenario runs (`scenario-runs/*`), assessments (`assessments/*`), role‑play sessions (`roleplay/sessions/*`), certificates (`certificate/*`, `certificates/*`), admin actions (`admin/*`), and tip submissions.
- `lib/` – Core utilities: Prisma client (`db.ts`), email helpers, verification token logic, AI coach (`ai/coach.ts`), role‑play AI (`ai/roleplay.ts`), scoring (`scoring.ts`), certificate management (`certificate.ts`), scenario definitions (`scenarios.ts`), and scenario‑run orchestration (`scenario-run.ts`).
- `prisma/` – Prisma schema (`schema.prisma`) and migrations for auth, scenario runs, role‑play sessions, user tips, and certificates.
- Configuration files: `tailwind.config.js`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`.
- Project metadata: `.gitignore`, `package.json`, `README.md`.

## Feature 5.2 — Game Modes (Detailed Explanation)

SafePath includes five interconnected game modes, each designed to train specific cognitive, emotional, and decision‑making skills related to personal safety. Users can play them individually or as part of structured training modules. The modes simulate situations women commonly face in public spaces, workplaces, social environments, online interactions, and travel scenarios. All modes feed data into the AI Safety Coach, Risk Meter, Confidence Score, and EQ Score to create measurable learning outcomes.

### 1. Simulation Mode
- **Purpose**: First‑person realistic safety situations to train situational awareness and rapid risk assessment.
- **Gameplay**: Interactive story with branching decisions (e.g., crowded bus scenario). Choices update the Risk Meter instantly and trigger AI Safety Coach feedback.
- **Key Implementation**:
  - Store scenarios in `lib/scenarios.ts` using a node‑based JSON schema (`nodeId`, `description`, `choices` with `riskImpact`, `eqImpact`, `nextNodeId`).
  - UI: a full‑screen React component (`SimulationPage`) that renders description, background media, and choice buttons.
  - Backend: optional API (`app/api/scenario-run/start/route.ts`) to persist decisions and compute scores.

### 2. Puzzle Mode
- **Purpose**: Teach manipulation‑pattern recognition, especially in digital/psychological interactions.
- **Gameplay**: Present a text/message; player identifies red‑flag lines.
- **Implementation**:
  - Define puzzles in `lib/puzzles.ts` (question, options, correct answer IDs).
  - Use a reusable `PuzzleComponent` with checkboxes/radio groups; on submit calculate risk/EQ impact.
  - Leverage existing scoring utilities (`lib/scoring.ts`).

### 3. Role‑Play Mode
- **Purpose**: Simulate live conversations with AI‑powered NPCs to practice assertive communication.
- **Gameplay**: User types free‑form replies; LLM (e.g., Anthropic) generates NPC responses based on scenario context and emotional‑tone tags.
- **Implementation**:
  - Create an LLM wrapper in `lib/ai/roleplay.ts` that accepts `playerMessage`, `scenarioContext`, and returns NPC reply.
  - Store session state in a Prisma model (`RoleplaySession`) for replay/analytics.
  - UI: chat‑style component (`RolePlayChat`) with streaming response support.

### 4. Strategy Mode
- **Purpose**: Encourage planning and resource management before a safety‑critical event.
- **Gameplay**: Users allocate time, choose routes, share live location, select tools, etc.
- **Implementation**:
  - Model resources (`time`, `riskLevel`, `contacts`, `tools`) in a new Prisma schema (`StrategyPlan`).
  - UI: drag‑and‑drop or selection interface (`StrategyPlanner`) that updates a live risk calculation.
  - Hook into the central risk engine to produce a `StrategyScore`.

### 5. Story Mode
- **Purpose**: Long‑form narrative journeys for empathy and reflective decision‑making.
- **Gameplay**: Episodic storytelling (e.g., follow Meera through campus, travel, online harassment). Player choices affect character development and final outcomes.
- **Implementation**:
  - Store episodes in `lib/stories.ts` (chapter, description, branching options).
  - Render with a `StoryPage` component that tracks cumulative EQ and confidence scores.
  - Provide a “review” screen summarizing emotional impact.

---

## Implementation Tips
1. **Data‑Driven Design** – Keep all scenario‑specific data (simulation nodes, puzzles, story episodes) in JSON/TS files under `lib/`. This makes it easy to add new content without code changes.
2. **Unified Scoring Service** – Centralise risk, confidence, and EQ calculations in `lib/scoring.ts`. Each mode calls `updateScores({risk, eq, confidence})` so the AI Safety Coach receives a consistent payload.
3. **LLM Integration** – Re‑use the existing `lib/ai/coach.ts` for post‑action feedback and create a sibling `lib/ai/roleplay.ts` for conversational NPCs. Share the same environment variables (`AI_PROVIDER`, API keys).
4. **API Layer** – Expose generic endpoints under `app/api/game-mode/*/route.ts` (e.g., `simulation`, `puzzle`, `roleplay`, `strategy`, `story`) that accept a session ID and player action, then persist via Prisma and return updated scores.
5. **Frontend Architecture** – Add a top‑level `app/game-mode/` folder with sub‑folders for each mode (`simulation/page.tsx`, `puzzle/page.tsx`, …). Use the existing layout (`app/layout.tsx`) for consistent navigation and Tailwind theming.
6. **State Management** – Extend the existing Zustand store (`lib/store.ts`) with mode‑specific slices (e.g., `useSimulationStore`, `usePuzzleStore`). Keep UI state (current node, selected answers) separate from persisted DB state.
7. **Testing** – Write unit tests for the JSON schema validators, scoring functions, and API route handlers. End‑to‑end tests can use Playwright to simulate a full user flow across modes.
8. **Analytics** – Emit events to your telemetry (if any) at the start/end of each mode and on every decision to monitor engagement and learning outcomes.

## Recommended Workflow for New Features
1. **Read the relevant directory** (e.g., `app/`, `lib/`) to understand existing patterns.
2. **Add new pages/components** under `app/` following the App Router conventions (e.g., `page.tsx`, `layout.tsx`).
3. **Create or extend API routes** in `app/api/` if server‑side logic is needed.
4. **Update Prisma schema** (if data model changes) and run `npm run prisma:migrate`.
5. **Add Tailwind classes** for styling; no need to modify CSS files directly.
6. **Run `npm run dev`** to test changes locally.
7. **Run `npm run lint`** before committing.

---

*This CLAUDE.md is intended for Claude Code to quickly understand how to work with this repository.*
1. **Read the relevant directory** (e.g., `app/`, `lib/`) to understand existing patterns.
2. **Add new pages/components** under `app/` following the App Router conventions (e.g., `page.tsx`, `layout.tsx`).
3. **Create or extend API routes** in `app/api/` if server‑side logic is needed.
4. **Update Prisma schema** (if data model changes) and run `npm run prisma:migrate`.
5. **Add Tailwind classes** for styling; no need to modify CSS files directly.
6. **Run `npm run dev`** to test changes locally.
7. **Run `npm run lint`** before committing.

## Existing Guidance Files
- **README.md** – Overview of the project, stack, and quick‑start steps.
- No `.cursor` or `.cursorrules` directories are present.
- No `.github/copilot-instructions.md` file is present.

---

*This CLAUDE.md is intended for Claude Code to quickly understand how to work with this repository.*