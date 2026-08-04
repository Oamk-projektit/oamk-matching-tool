# Testing

How to run and extend the test suite for the OAMK Matching Tool.

---

## 1. Unit tests

```bash
npm test          # vitest run — single pass, CI-friendly
npm run test:watch  # vitest — watch mode for local development
```

Test files (Vitest, `*.test.ts`, colocated with source):

| File | Covers |
|------|--------|
| `lib/matching/calculate-match.test.ts`, `lib/matching/engine.test.ts` | Scoring formula: weights validation, per-criterion ratios, rounding/clamping, determinism |
| `lib/matching/flows.test.ts` | Ranking behaviour for the seeded demo data (student and teacher paths) |
| `lib/applications/applications.test.ts` | Application creation, duplicate/window/ownership guards, withdrawal, applicant visibility, audit action names |
| `lib/selections/selections.test.ts` | Selection eligibility, ownership, decision visibility, algorithm rank snapshot, audit vocabulary |
| `lib/projects/projects.test.ts` | Project creation/listing rules |
| `lib/students/students.test.ts` | Student profile CRUD rules |
| `lib/permissions/permissions.test.ts` | Role helpers and company/student/match ownership checks |
| `lib/notifications/notifications.test.ts`, `lib/notifications/messages.test.ts` | Notification creation, idempotency, bilingual message templates |
| `lib/i18n/messages.test.ts` | FI/EN message catalogs |
| `lib/validation/parsers.test.ts` | Request body validation/parsing |
| `lib/api/foundation.test.ts`, `lib/api/crud.test.ts`, `lib/api/bearer.test.ts`, `lib/api/client.test.ts` | API response envelopes, bearer token extraction, generic CRUD helpers |
| `lib/shared/api-client.test.ts`, `lib/shared/demo-fixtures.test.ts` | Shared frontend API client and fixture data |
| `types/domain.test.ts`, `types/database.contract.test.ts` | Domain type invariants (e.g. weights sum to 100) and DB/type contract alignment |

## 2. Type-check and combined verify

```bash
npx tsc --noEmit     # type-check only
npm run verify        # tsc --noEmit && vitest run — run this before pushing/PRs
```

## 3. Smoke scripts (live server + seed data)

Require `npm run dev` running, `.env.local` configured, and `supabase db reset` already applied (seed data present).

```bash
npm run smoke          # health + auth + list projects
npm run smoke:student  # full student journey: login → me → matches → apply → notifications
npm run smoke:company  # company journey: projects → applicants → Top 3 → selections
npm run smoke:teacher  # teacher journey: projects → applicants → matches → audit
npm run smoke:flows    # student + teacher flows
```

Scripts live in `scripts/` (`api-smoke.mjs`, `flow-student.mjs`, `flow-company.mjs`, `flow-teacher.mjs`, `flow-all.mjs`, shared helpers in `scripts/lib/smoke-helpers.mjs`). They authenticate via `signInWithPassword` and call the **projects-model** API with a Bearer token — see `docs/API_TESTING.md` for the manual Postman equivalent. Full UI checklist: `docs/DEMO_CHECKLIST.md`.

## 4. Privacy test checklist (manual or automated E2E)

These mirror the privacy rules in `docs/SECURITY.md` and should pass before any release/demo. Each row names the rule and a concrete way to check it with two demo accounts from `supabase/seed.sql`.

| # | Rule | How to verify |
|---|------|----------------|
| 1 | Top 3 hidden from students | As `aino.virtanen@students.oamk.fi`, call `GET /api/projects/:id/top-candidates` for any project → expect `403 FORBIDDEN` |
| 2 | Student sees only own match | As a student, call `GET /api/matches/me` → every row's `studentId` equals the caller's own student ID; no peer scores appear |
| 3 | Full ranked applicant list is staff-only | As a student, call `GET /api/projects/:id/applicants` or `GET /api/projects/:id/matches` → expect `403 FORBIDDEN` |
| 4 | Company isolation | As `contact@nordicsoft.example` (Nordic Soft), try to fetch a Polar Byte project's applicants/matches/selections → expect `403`/`404`, never Polar Byte data |
| 5 | Draft projects invisible to non-owners | As a student or a different company, `GET /api/projects` must not list a `draft` project owned by another company; `GET /api/projects/:id` on that draft's ID must not succeed |
| 6 | Student cannot self-select | As a student, attempt `PATCH /api/applications/:id/status` with `{"status":"selected"}` → expect `403` (only company/admin may set non-`withdrawn` statuses) |
| 7 | Withdrawn applications cannot be selected | Withdraw an application, then attempt `POST /api/projects/:id/selections` referencing it → expect `409 CONFLICT` |
| 8 | Selection capacity enforced | Fill all `positions` on a project with `selected` decisions, then attempt one more → expect `409 CONFLICT` |
| 9 | Notifications are own-inbox only | As student A, call `GET /api/notifications` → only rows with `profileId` equal to A appear; never another user's notification |
| 10 | Audit read is staff-only | As a student or company, call `GET /api/audit` → expect `403 FORBIDDEN`; as `teacher.demo@oamk.fi` or admin → `200` with recent events |
| 11 | Service role never in browser | `grep -r SUPABASE_SERVICE_ROLE_KEY` the built client bundle (`.next/static`) → no matches; confirm `lib/supabase/admin.ts` starts with `import 'server-only'` |
| 12 | Selection decision privacy | As a student not involved in a decision, `GET /api/applications/:id/decision` for someone else's application → expect `403` |

## 5. Demo seed accounts

From `supabase/seed.sql` (local/dev only, loaded by `supabase db reset`). Password for every account: `LocalDemoOnly!1` (fictional, local Supabase Auth only — never use in a real deployment).

| Role | Email | Notes |
|------|-------|-------|
| Teacher | `teacher.demo@oamk.fi` | Oversight, `GET /api/audit` access |
| Admin | `admin.demo@oamk.fi` | Full access |
| Company | `contact@nordicsoft.example` | Owns Nordic Soft Oy projects |
| Company | `hr@polarbyte.example` | Owns Polar Byte Ab projects — use for the company-isolation check above |
| Student | `aino.virtanen@students.oamk.fi` | 160 credits, strong skill/course overlap — good "high score" demo case |
| Student | `mikko.korhonen@students.oamk.fi` | 90 credits, partial overlap |
| Student | `sara.nieminen@students.oamk.fi` | 45 credits, internship-only preference |
| Student | `alex.smith@students.oamk.fi` | English-speaking profile |
| Student | `emilia.laitinen@students.oamk.fi` | Broader skill set (cloud/security) |

## Related docs

- `docs/BACKEND_SETUP.md` — env setup required before running smoke scripts
- `docs/SECURITY.md` — the privacy/RLS rules these tests verify
- `docs/API_TESTING.md` — Postman collection + Bearer token walkthrough
- `docs/MATCHING_ALGORITHM.md` — what the matching unit tests assert against
