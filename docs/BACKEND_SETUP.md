# Backend Setup

Full setup guide for running and deploying the OAMK Matching Tool backend (Next.js Route Handlers + Supabase). This file stands alone; see also `docs/BACKEND.md` for the original Tommi-owned notes and `docs/SCHEMA.md` / `docs/API.md` for the data and HTTP contracts.

---

## 1. Prerequisites

- Node.js 20+ and npm
- A Supabase project (local via Supabase CLI, or hosted)
- Supabase CLI if you want to run migrations/seed locally (`supabase db reset`)

---

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill in real values. **Never commit `.env.local` or real secrets.**

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes* | Anon/public key (browser + RLS-scoped server clients) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (for privileged API routes) | Service role key — server-only, bypasses RLS |
| `APP_URL` | recommended | Canonical app URL, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | optional | Newer Supabase "publishable key" alias; used if `ANON_KEY` is unset |
| `INTERNAL_API_SECRET` | optional | Reserved for internal/job-to-job calls |
| `NEXT_PUBLIC_APP_URL` | optional | Legacy alias for `APP_URL`, still read by `getAppUrl()` |
| `MATCHING_DEFAULT_LIMIT` | optional | Default match list page size (default `10`) |

\* Provide **either** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Example `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # or sb_secret_... on newer projects
APP_URL=http://localhost:3000
```

### Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle.
- Browser code uses only `NEXT_PUBLIC_*` keys via `lib/supabase/client.ts`.
- Route Handlers that must bypass RLS use `lib/supabase/admin.ts` (marked with the `server-only` package — it cannot be imported from Client Components).
- Prefer the cookie-based server client (`lib/supabase/server.ts`) when acting as the signed-in user; this keeps RLS enforced.
- `middleware.ts` refreshes the Supabase Auth session cookie via `lib/supabase/middleware.ts` on every non-static request.
- Resolve the app base URL in server code with `getAppUrl()` (`APP_URL`, falling back to `NEXT_PUBLIC_APP_URL`).

---

## 3. Database: migrations and seed

Migrations live in `supabase/migrations/` and **must be applied in filename/timestamp order**. They fall into two eras:

1. `20260803120000` – `20260803120300` — original Sprint‑1 "opportunities" schema.
2. `20260804140000_drop_legacy_opportunity_schema.sql` onward — drops the Sprint‑1 tables and (re)builds the **current, canonical projects-model schema**: enums/helpers → profiles/companies → catalogs/students → projects → applications/matches/selections → indexes/audit triggers → RLS → student course completion → contract alignments → selection capacity → project bundle update → application audit/withdrawn guard → selection snapshots + notifications.

**Local setup:**

```bash
supabase db reset   # drops, re-applies all migrations in order, then runs supabase/seed.sql
```

**Hosted/production setup (no CLI, e.g. SQL editor):**

Apply every file in `supabase/migrations/` in filename order. Do **not** run `supabase/seed.sql` in production — it inserts fictional Auth users, companies, students, and projects for local demos only (all passwords `LocalDemoOnly!1`).

Confirm RLS is enabled after migrating — see `docs/SCHEMA.md` → Row Level Security.

---

## 4. Local development

```bash
npm ci
npm run dev
npm test
```

Health check:

```bash
curl http://localhost:3000/api/health
```

Expect `{ "data": { "status": "ok", "database": "connected", ... } }`. A `503` means env vars are missing or the DB probe failed.

---

## 5. Auth behaviour

| Layer | Behaviour |
|-------|-----------|
| `middleware.ts` | Refreshes Supabase Auth cookies on every request; redirects unauthenticated users away from protected pages (everything except `/`, `/login`, `/register`, `/teacher/login`, `/style-guide`) |
| `/api/*` routes | Authenticate themselves via `requireAuth()` (`lib/api/auth.ts`); always return JSON errors, never an HTML redirect |
| Auth modes | Browser session cookies **or** `Authorization: Bearer <access_token>` (see `lib/api/bearer.ts`) — both resolve to the same `AuthContext` |
| `profiles` | Auto-created on first authenticated API call if missing (`ensureProfile`); a DB trigger normally creates it at signup |
| `GET /api/me` | Returns the current profile, `studentId` (if any), and `companyId` (if any) |

---

## 6. Local auth: creating test users

For local Supabase, either:

- Run `supabase db reset` to load the seed accounts (see the table in the root `README.md`), or
- Sign up via `/register` (creates a `student` by default) or use the Supabase Studio Auth UI to set `role` in `raw_user_meta_data` before first login.

---

## 7. Smoke checklist (current projects APIs)

Manual verification against a running dev server (`npm run dev`) plus seed data. Use a signed-in session cookie or a Bearer access token (obtain one via `supabase.auth.signInWithPassword` or the Supabase Studio "Get user token" tool).

1. `GET /api/health` → `200`, `status: "ok"`
2. `GET /api/me` (anonymous) → `401`
3. Sign in as a student → `GET /api/me` → `role: "student"`, `studentId` present
4. `GET /api/projects` → `200`, list of published projects (`meta.count > 0` after seed)
5. `GET /api/projects/:id` → `200`, `ProjectDetail` with weights and catalog IDs
6. `POST /api/applications` with a valid `projectId` → `201` (or `409` if already applied)
7. `POST /api/matches/run` with `{ "projectIds": ["..."] }` → `200`, scores 0–100
8. `GET /api/matches/me` → own matches only, includes `weightsSnapshot`
9. Sign in as the owning company → `GET /api/projects/:id/applicants` → sorted by score desc
10. `GET /api/projects/:id/top-candidates` → top 3 by default; **student token on the same URL → `403 FORBIDDEN`**
11. `POST /api/applications/:id/shortlist` (company) → `201`, status becomes `shortlisted`
12. `POST /api/projects/:id/selections` with a valid `applicationId` → `201` `SelectionDecision`; student receives a `student_selected`/`student_not_selected` notification
13. `GET /api/notifications?unread=true` → unread inbox for the signed-in user
14. Sign in as a teacher → `GET /api/audit` → recent audit events; student/company tokens on the same URL → `403`

Full endpoint reference: `docs/API.md`.

---

## 8. Deploy checklist

| Item | Status |
|------|--------|
| Migrations versioned in repo, applied in order | required |
| Env vars set on host (same names as `.env.example`) | required |
| `SUPABASE_SERVICE_ROLE_KEY` set only on the server (never `NEXT_PUBLIC_*`) | required |
| Health endpoint reachable | `GET /api/health` |
| Session middleware active | `middleware.ts` + `lib/supabase/middleware.ts` |
| RLS enabled on every `public.*` application table | see `docs/SCHEMA.md` |
| Unit tests passing | `npm test` / `npm run verify` |
| `supabase/seed.sql` **not** run against production | required |

### Suggested deploy steps

1. Create (or reuse) a production Supabase project.
2. Apply every file in `supabase/migrations/` in timestamp order (CLI `supabase db push` or SQL editor).
3. Deploy the Next.js app (e.g. Vercel).
4. Set environment variables in the host dashboard, matching `.env.example` names.
5. Set the Supabase Auth redirect URL to your `APP_URL`.
6. Verify `GET /api/health` and, after logging in, `GET /api/me`.

---

## Related docs

- `docs/API.md` — HTTP contract
- `docs/SCHEMA.md` — tables, RLS, indexes
- `docs/MATCHING_ALGORITHM.md` — scoring formula
- `docs/SECURITY.md` — auth, RLS, privacy summary
- `docs/TESTING.md` — unit tests and smoke scripts
- `docs/BACKEND.md` — original setup notes (superseded by this file for setup purposes)
