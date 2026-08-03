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
```

Health check:

```bash
curl http://localhost:3000/api/health
```

---

## Deploy readiness

| Item | Status target |
|------|----------------|
| Migrations versioned in repo | yes |
| Env vars documented | yes |
| Health endpoint | `/api/health` |
| RLS on all app tables | yes |
| Service role only on server | yes |
| Seed not used in production | yes |

Suggested hosts: Vercel (Next.js) + Supabase (DB/Auth). Set the same env vars in the host dashboard. Run migrations against the production Supabase project before first traffic.

---

## Related docs

- `docs/API.md` — HTTP contract
- `docs/SCHEMA.md` — tables, RLS, indexes
- `docs/VENLA_TASKS.md` — frontend integration follow-ups
