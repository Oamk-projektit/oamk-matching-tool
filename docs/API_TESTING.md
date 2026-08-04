# API testing with Postman

Backend smoke tests for issue-style verification before frontend integration.

## Prerequisites

1. App running: `npm run dev`
2. Migrations applied + optional `supabase/seed.sql`
3. `.env.local` configured (including `SUPABASE_SERVICE_ROLE_KEY` for matching/notifications)

## Import

1. Open Postman → **Import** → select `docs/postman_collection.json`
2. Set collection variable `baseUrl` (default `http://localhost:3000`)
3. Set `accessToken` to a Supabase **access_token** (JWT)

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

Use teacher token (`teacher.demo@oamk.fi`) for opportunity create / applicant list / status updates.

## Suggested order

1. **Health** (no auth)
2. **Me** (verify role)
3. **Create student** (student token) → copy `id` → `studentId`
4. **Create opportunity** (teacher token) → copy `id` → `opportunityId`
5. **Create application** (student token)
6. **Run matching** → **Get student matches**
7. **List applicants** (teacher)
8. **Update application status** (teacher)
9. **List notifications** (both roles)

## Auth modes supported by the API

| Mode | How |
|------|-----|
| Browser session | Supabase SSR cookies |
| Postman / scripts | `Authorization: Bearer <access_token>` |

See also: `docs/API.md`, `docs/BACKEND.md`.
