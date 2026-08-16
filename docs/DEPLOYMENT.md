# Production deployment

Runbook for deploying the OAMK Matching Tool (Next.js on Vercel + hosted Supabase).

**Do not run `supabase/seed.sql` against production.** Demo password `LocalDemoOnly!1` is local-only.

---

## Current production targets (2026-08-05)

| Item | Value |
|------|--------|
| Git branch | `main` @ `cfaca06` |
| Supabase project | `Oamk-matchingtool-mvp` |
| Project ref | `ccikjwmbomrluqlscnja` |
| Region | `eu-north-1` |
| App (alias) | https://oamk-matching-tool.vercel.app |
| Vercel project | `t3jato02s-projects/oamk-matching-tool` |
| Migrations on remote | all through `20260804141400` (synced, no seed) |

---

## 1. Supabase

### Link (once)

```bash
npx supabase login
npx supabase link --project-ref ccikjwmbomrluqlscnja
```

### Push migrations (never seed)

```bash
npx supabase migration list
npx supabase db push
```

Confirm every local migration has a matching `remote` timestamp. Do **not** run `supabase db reset` or `supabase/seed.sql` on the hosted project.

### Auth URLs (Dashboard)

Supabase Dashboard → **Authentication** → **URL configuration**:

| Setting | Value |
|---------|--------|
| Site URL | `https://oamk-matching-tool.vercel.app` |
| Redirect URLs | `https://oamk-matching-tool.vercel.app/**` |
| | `https://oamk-matching-tool-*.vercel.app/**` (preview deploys) |
| | `http://localhost:3000/**` (local dev) |

If you add a custom domain, update Site URL and add that origin to Redirect URLs, then set `APP_URL` on Vercel to the same origin.

---

## 2. Vercel environment variables

Required (same names as `.env.example`):

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ccikjwmbomrluqlscnja.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — never `NEXT_PUBLIC_*` |
| `APP_URL` | `https://oamk-matching-tool.vercel.app` |

Optional: `INTERNAL_API_SECRET`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Sync keys from the linked Supabase project (does not print secrets):

```bash
npx vercel link --yes --project oamk-matching-tool
node scripts/sync-vercel-env.mjs
# after first production URL is known:
# $env:APP_URL="https://oamk-matching-tool.vercel.app"; node scripts/sync-vercel-env.mjs
```

Redeploy after changing env vars.

### GitHub auto-deploy

CLI link may fail to attach the org repo (`Oamk-projektit/oamk-matching-tool`) to a personal Vercel account. In that case connect the repo in the Vercel dashboard (**Settings → Git**) so `main` deploys automatically. Until then, production updates are `npx vercel --prod`.

---

## 3. Deploy

```bash
git switch main
git pull --ff-only origin main
npx vercel --prod --yes
```

---

## 4. Production smoke

### Always (no seed required)

```bash
curl https://oamk-matching-tool.vercel.app/api/health
```

Expect:

```json
{
  "data": {
    "status": "ok",
    "service": "oamk-matching-tool",
    "database": "connected"
  },
  "meta": {}
}
```

`GET /api/me` without a session must return `401`.

### Do not run local seed smokes against production

`npm run smoke`, `smoke:student`, `smoke:company`, and `smoke:teacher` use `LocalDemoOnly!1` seed accounts. Those users must not exist in production.

After creating a real test user via `/register` (or Dashboard Auth):

1. Sign in at `/login`
2. `GET /api/me` → `role: "student"`
3. Browse `/projects`, create a company user + project in Dashboard/SQL if needed
4. Walk `docs/DEMO_CHECKLIST.md` with **non-seed** credentials

---

## 5. Email

In-app notifications persist. Outbound email is still a **stub** (`lib/notifications/email-stub.ts`). Production does not send SMTP mail until a provider is wired.

---

## 6. Rollback notes

- **App:** Vercel → previous production deployment → Promote
- **DB:** do not rewrite applied migrations; add a new forward migration if a hotfix is needed
