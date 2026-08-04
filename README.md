# OAMK Matching Tool

A Next.js + Supabase MVP that matches OAMK students to company projects and internships based on courses, skills, language, availability, interests, and degree programme. The matching engine produces a deterministic 0–100 score with an explanation; companies always make the final selection — the algorithm never auto-selects a student.

**Status: MVP complete** — backend (Supabase schema, RLS, `/api/*` routes, matching engine) and frontend (Next.js App Router pages) are built on the canonical **projects** model described in `types/domain.ts`.

## Roles

| Role | Can do |
|------|--------|
| `student` | Manage own profile (courses, skills, interests, availability), browse published projects, apply, see **only their own** match result |
| `company` | Create/manage own projects, view applicants and Top 3 ranked candidates for own projects, make the final selection decision |
| `teacher` | Oversight: browse all projects, applicants, matches, and selections across companies (read-only, no ownership, no final selection); read audit history |
| `admin` | Full access, including cross-company management |

Role is always read from `profiles.role` in the database — never trusted from a request body.

## Quick start

```bash
npm ci
cp .env.example .env.local   # fill in Supabase project URL + keys
supabase db reset            # applies supabase/migrations/ and supabase/seed.sql
npm run dev
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

Demo accounts (from `supabase/seed.sql`, password `LocalDemoOnly!1` for all — local Supabase Auth only, not a real secret):

| Role | Email |
|------|-------|
| Teacher | `teacher.demo@oamk.fi` |
| Admin | `admin.demo@oamk.fi` |
| Company | `contact@nordicsoft.example`, `hr@polarbyte.example` |
| Student | `aino.virtanen@students.oamk.fi` (strong match), `mikko.korhonen@students.oamk.fi`, `sara.nieminen@students.oamk.fi`, `alex.smith@students.oamk.fi`, `emilia.laitinen@students.oamk.fi` |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) — matching engine, validation, permissions, API helpers |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run verify` | `tsc --noEmit` + `npm test` — run before pushing |
| `npm run gen:types` | Regenerate `types/database.ts` from the live Supabase schema |
| `npm run smoke` | Basic API smoke: health + auth + list projects |
| `npm run smoke:student` | Full student journey against the live API |
| `npm run smoke:teacher` | Full teacher/staff journey against the live API |
| `npm run smoke:flows` | Runs `smoke:student` + `smoke:teacher` |

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/API.md](docs/API.md) | REST contract for every `/api/*` route |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database tables, RLS policies, indexes |
| [docs/MATCHING_ALGORITHM.md](docs/MATCHING_ALGORITHM.md) | How the 0–100 match score is calculated |
| [docs/SECURITY.md](docs/SECURITY.md) | Auth modes, RLS summary, privacy rules, audit |
| [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md) | Env vars, migrations, seed, deploy checklist |
| [docs/TESTING.md](docs/TESTING.md) | Unit tests, smoke scripts, privacy test checklist |
| [docs/PROJECT_WORK.md](docs/PROJECT_WORK.md) | Project work summary (division of work, architecture, demo) |
| [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md) | What is / isn't in the MVP (SHARED, FI) |
| [docs/SHARED_CONTRACT.md](docs/SHARED_CONTRACT.md) | Epic 0 shared contract examples (SHARED) |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | UI design tokens and components |
| [docs/API_TESTING.md](docs/API_TESTING.md) | Postman / Bearer token testing guide |
| [docs/DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md) | Demo run-through checklist (FI) |
| [docs/RAPORTTI*.md](docs/RAPORTTI.md) | Course report drafts (FI) |

Database migrations live in `supabase/migrations/` (apply with the Supabase CLI or the SQL editor, in filename/timestamp order).

## Privacy highlights

- **Top 3 / ranked applicant lists are private.** Only the owning company, teachers, and admins can see them (`GET /api/projects/:id/top-candidates`); students always get `403 FORBIDDEN`.
- **A student sees only their own match result** (`GET /api/matches/me`) — never peer scores, ranks, or identities.
- **Companies cannot see each other's data.** RLS enforces company isolation on projects, applicants, matches, and selections.
- **Matching never auto-selects.** The engine only scores and ranks; the company makes the final `SelectionDecision`.
- Students may see the **criteria and weights** used to score them, for transparency — but not other applicants' breakdowns.
- The Supabase **service role key is never sent to the browser** — it is used only in server-only modules (`lib/supabase/admin.ts`, marked with the `server-only` package).

## Known limitations (MVP scope)

- **No real email/SMTP.** Notifications are in-app only (`notifications` table); email sending is out of scope for the MVP.
- **Thesis topics are out of scope.** `projects.projectType` supports only `company_project` and `internship`.
- **Audit trail is DB-trigger based**, not a separate audit service: every sensitive write (projects, applications, matches, selections, notifications) is captured automatically by Postgres triggers into `audit_events`, readable via `GET /api/audit` (teacher/admin only).
- No payments, chat, mobile app, or external AI matching service. See [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md) for the full rajaus (scope boundary).
