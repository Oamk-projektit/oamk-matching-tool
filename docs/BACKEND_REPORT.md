# Backend technical notes (report draft)

Tommi’s section for the course report — summarise and polish in the final document.

## Goal

Provide a secure MVP backend that stores students, opportunities (projects/internships), applications and match results, and exposes a shared REST API for the Next.js frontend.

## Stack

- **Next.js App Router** Route Handlers (`app/api/**`)
- **Supabase** Postgres + Auth + Row Level Security
- **TypeScript** shared contracts in `types/domain.ts` and `types/api.ts`
- **Vitest** for deterministic matching and validation unit tests

## Architecture

```text
Browser / Postman
    │  cookies or Bearer access_token
    ▼
Next.js middleware (session refresh, page guards)
    │
    ▼
/api/* Route Handlers
    │  requireAuth() → role from profiles
    ▼
Service layer (students, opportunities, applications, matching, notifications)
    │
    ▼
Supabase (RLS user client or service-role admin for privileged writes)
```

Privileged operations (match upserts, cross-user notifications) use `SUPABASE_SERVICE_ROLE_KEY` only on the server.

## Data model (summary)

Canonical schema: `docs/SCHEMA.md`.

- `students` + courses/skills/interests/preferences
- `opportunities` (+ required skills/courses + per-opportunity weights)
- `applications` (unique student–opportunity pair)
- `matches` (score 0–100 + explanation fields)
- `notifications` (in-app inbox; email out of MVP scope)
- `profiles.role` = `student` | `teacher` | `admin`

## Matching algorithm

Deterministic weighted score in `lib/matching/engine.ts`:

| Factor | Default weight |
|--------|----------------|
| Required courses overlap | 0.30 |
| Required skills overlap | 0.40 |
| Language match | 0.10 |
| Schedule compatibility | 0.10 |
| Credits vs minimum | 0.10 |

Same inputs always produce the same integer score and explanation/recommendation text. Results are ranked by score, then opportunity id.

## Security

- RLS enabled on all application tables
- API returns JSON 401/403 (no HTML login redirect on `/api`)
- Page middleware uses Supabase `getUser()` (JWT validation)
- Service role never exposed to the client

## Testing

- Unit: `npm test` (matching, validation, bearer parsing, notification copy)
- Manual: Postman collection `docs/postman_collection.json` + `docs/API_TESTING.md`
- Health: `GET /api/health`

## Deploy outline

1. Apply SQL migrations to production Supabase
2. Deploy Next.js (e.g. Vercel) with env vars from `.env.example`
3. Configure Auth redirect URLs
4. Do **not** run seed SQL in production

## Out of scope / future work

- Real email delivery (notifications are stored only)
- Advanced analytics dashboards
- External AI APIs for matching
- Full E2E CI against a live Supabase instance
