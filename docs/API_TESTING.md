# API testing with Postman

Backend smoke tests for issue-style verification and demo backup (#153).

## Prerequisites

1. App running: `npm run dev`
2. Migrations applied + optional `supabase/seed.sql`
3. `.env.local` configured (including `SUPABASE_SERVICE_ROLE_KEY` for matching/notifications)

## Import

1. Open Postman → **Import** → select `docs/postman_collection.json`
2. Set collection variable `baseUrl` (default `http://localhost:3000`)
3. Set `accessToken` to a Supabase **access_token** (JWT)
4. Optional: keep seed `projectId` `90000000-0000-4000-8000-000000000001` (Campus portal)

## How to get an access token

### Option A — Supabase JS (browser console / script)

Sign in with a seed user (local seed password `LocalDemoOnly!1`):

```js
const { createClient } = supabase
const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
const { data, error } = await client.auth.signInWithPassword({
  email: 'aino.virtanen@students.oamk.fi',
  password: 'LocalDemoOnly!1',
})
console.log(data.session.access_token)
```

### Option B — Password grant (curl)

```bash
curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"aino.virtanen@students.oamk.fi","password":"LocalDemoOnly!1"}'
```

Copy `access_token` into the Postman collection variable.

| Need | Seed email |
|------|------------|
| Student flows | `aino.virtanen@students.oamk.fi` |
| Company create / applicants / selection | `contact@nordicsoft.example` |
| Teacher audit / oversight | `teacher.demo@oamk.fi` |

## Suggested order

1. **Health** (no auth)
2. **Me** (verify role; copy `studentId` if present)
3. **List published projects** (student or any auth)
4. **Run matching** → **My matches** (student token; no rank fields)
5. **Create application** (student) → copy `applicationId`
6. Switch to **company** token → **List applicants** / **Top candidates**
7. **Shortlist** → **Create selection decision**
8. Switch to **teacher** token → **Audit**
9. Optional: **Legacy opportunities** → expect **410**

## Prefer scripts when possible

| Journey | Command |
|---------|---------|
| Student | `npm run smoke:student` |
| Company | `npm run smoke:company` |
| Teacher | `npm run smoke:teacher` |
| All | `npm run smoke:flows` |
| Authz probes | `npm run smoke:security` |

## Auth modes supported by the API

| Mode | How |
|------|-----|
| Browser session | Supabase SSR cookies |
| Postman / scripts | `Authorization: Bearer <access_token>` |

See also: `docs/API.md`, `docs/BACKEND.md`, `docs/DEMO_CHECKLIST.md`.
