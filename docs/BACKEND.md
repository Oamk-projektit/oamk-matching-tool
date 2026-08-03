# Backend setup

Tommi-owned backend notes for the Next.js + Supabase MVP.

---

## Environment variables

Create `.env.local` (never commit secrets):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Anon/public key (browser + RLS-scoped server) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (API) | Service role key for privileged Route Handlers only |
| `NEXT_PUBLIC_APP_URL` | recommended | Canonical app URL, e.g. `http://localhost:3000` |

Optional:

| Variable | Description |
|----------|-------------|
| `MATCHING_DEFAULT_LIMIT` | Default match list size (default `10`) |

### Rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client bundle.
- Browser code uses only `NEXT_PUBLIC_*` keys via `lib/supabase/client.ts`.
- Route Handlers that must bypass RLS use `lib/supabase/admin.ts` (service role).
- Prefer the cookie-based server client (`lib/supabase/server.ts`) when acting as the signed-in user.
- Middleware refreshes the Auth session via `lib/supabase/middleware.ts`.

Example `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Database

1. Create a Supabase project.
2. Apply migrations in `supabase/migrations/` (CLI `supabase db push` / `db reset`, or SQL editor in order).
3. Load seed with `supabase/seed.sql` on local/dev only.
4. Confirm RLS is enabled (see `docs/SCHEMA.md`).

---

## Local development

```bash
npm install
npm run dev
npm test
```

Health check:

```bash
curl http://localhost:3000/api/health
```

---

## Auth behaviour

| Layer | Behaviour |
|-------|-----------|
| `middleware.ts` | Refreshes Supabase cookies; protects non-public pages with real `getUser()` |
| `/api/*` | Own auth via `requireAuth()`; returns JSON errors (no HTML redirect) |
| `profiles` | Auto-created on first API auth if missing (`ensureProfile`) |
| `/api/me` | Current `user_id`, `email`, `role`, `student_id` |

Public pages (no login redirect): `/`, `/login`, `/register`, `/teacher/login`, `/style-guide`.

---

## API smoke checklist

Use a logged-in session cookie (browser) or Supabase access token as Bearer via your HTTP client after `signIn`.

1. `GET /api/health` → `status: ok`
2. `GET /api/me` → role + ids (401 if anonymous)
3. `POST /api/students` → create own profile
4. `GET /api/opportunities` → list
5. `POST /api/opportunities` → as teacher
6. `POST /api/applications` → as student
7. `POST /api/matches/run/:studentId` → scores persisted
8. `GET /api/matches/:studentId` → ranked results
9. `GET /api/notifications` → inbox + `unread_count`
10. `PATCH /api/applications/:id` with `{ "status": "accepted" }` → student notified

Full contract: `docs/API.md`.

---

## Deploy readiness

| Item | Status |
|------|--------|
| Migrations versioned in repo | yes |
| Env vars documented | yes (`.env.example`) |
| Health endpoint | `/api/health` |
| Session middleware | Supabase SSR refresh |
| RLS on all app tables | yes |
| Service role only on server | yes |
| Unit tests | `npm test` |
| Seed not used in production | yes |

### Suggested deploy steps

1. Create/use production Supabase project.
2. Apply all files in `supabase/migrations/` in timestamp order.
3. Deploy Next.js to Vercel (or similar).
4. Set env vars in the host dashboard (same names as `.env.example`).
5. Set Supabase Auth redirect URL to `NEXT_PUBLIC_APP_URL`.
6. Verify `GET /api/health` and `GET /api/me` after login.

Do **not** run `supabase/seed.sql` in production.

---

## Related docs

- `docs/API.md` — HTTP contract
- `docs/SCHEMA.md` — tables, RLS, indexes
- `docs/VENLA_TASKS.md` — frontend integration follow-ups
