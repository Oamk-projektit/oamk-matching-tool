# Security

Summary of authentication, authorization, and data-privacy controls for the OAMK Matching Tool. Canonical sources: `lib/api/auth.ts`, `supabase/migrations/20260804140700_rls_policies.sql`, `supabase/migrations/20260804140600_indexes_and_audit_triggers.sql`, `middleware.ts`.

---

## 1. Auth modes

Every `/api/*` route resolves the caller via `requireAuth()` (`lib/api/auth.ts`), which accepts either:

1. **Browser session cookies** — Supabase SSR cookies, refreshed on every request by `middleware.ts` via `lib/supabase/middleware.ts`.
2. **`Authorization: Bearer <access_token>`** — a Supabase Auth access token, used for scripts/tests (`scripts/*.mjs`) and Postman (`docs/API_TESTING.md`).

Both paths call `supabase.auth.getUser()` (never trusting a locally-decoded JWT) and resolve to the same `AuthContext { user, role, profileId, profile, supabase }`. Unauthenticated API calls always get a JSON `401 UNAUTHORIZED` — never an HTML redirect. Pages, by contrast, are redirected to `/login` or `/teacher/login` by `middleware.ts` if unauthenticated and not on the public list (`/`, `/login`, `/register`, `/teacher/login`, `/style-guide`).

## 2. Role source of truth: `profiles.role`

- Roles are `student` | `company` | `teacher` | `admin`, stored on `public.profiles.role`.
- A role is **never** trusted from a request body or client-supplied header. Route handlers read `ctx.role` from the authenticated profile row (`ensureProfile()`), and Postgres RLS policies independently re-check role via `SECURITY DEFINER` helper functions (`current_user_role()`, `is_admin()`, `is_teacher()`, `is_teacher_or_admin()`, `is_company_role()`, `is_student()`).
- On first authenticated API call for a brand-new Auth user, `ensureProfile()` creates a `profiles` row; the initial role may be seeded from Auth signup metadata (defaults to `student`) but can never be **escalated** later via the API — role changes require a direct DB/admin action.

## 3. Row Level Security (RLS) summary

RLS is enabled on every `public.*` application table. Highlights (full policy list in `docs/SCHEMA.md` and the migration file):

| Concern | Enforcement |
|---------|-------------|
| Student profile, courses, skills, interests | Owner-only CRUD (`owns_student_row`), plus staff (teacher/admin) read |
| Published projects | Readable by any authenticated user |
| Draft projects | Only the owning company (`owns_project`) or staff can read/write |
| Project create/update/delete | Only a `company`-role member of the owning `company_id`, or admin — **teachers cannot create or own projects** |
| Applications | Visible to the applying student **or** staff of that project (`can_view_project_staff` = owning company member, teacher, or admin) — never another company |
| Matches | Same visibility rule as applications — a student can only ever see rows where `owns_student_row(student_id)` is true for themselves |
| Selection decisions | Insert/update restricted to the owning company (`is_company_role() AND owns_project()`) or admin; teachers get **read-only** access; students see only their own decision |
| Notifications | Strictly own-inbox (`profile_id = auth.uid()`), or admin |
| Audit events | `SELECT` restricted to `is_teacher_or_admin()`; all writes happen only through `SECURITY DEFINER` triggers, never directly from client roles |

Service role (`SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS entirely and is reserved for narrow server-side jobs (see §5).

## 4. Top 3 / ranking privacy

- `GET /api/projects/:id/top-candidates` (default top 3, max 10) is restricted to the owning company, teacher, or admin at **both** the route-handler level (explicit `403` for `role === 'student'`) and the RLS level (`matches_select_own_or_project_staff`).
- `GET /api/projects/:id/applicants` and `GET /api/projects/:id/matches` (full ranked list, not just top-N) are staff/owner-only routes; there is no student-facing equivalent.
- `GET /api/matches/me` is the **only** match-reading endpoint available to students, and it is hard-scoped to the caller's own `studentId` in both the handler and RLS — a student can never fetch another student's match by guessing an ID.
- Students may see the **criteria and weights** used to compute their own score (`weightsSnapshot` on their own match) for transparency, but never another applicant's score, rank, or breakdown.

## 5. Company isolation

- A company can only see/manage projects where `company_users.company_id` matches, enforced by `owns_project()` / `member_of_company()`.
- Applicants, matches, and selection decisions for **another** company's project are invisible even to an authenticated `company`-role user — RLS filters at the database layer, so this holds even if an API route had a bug.
- `profiles_select_own_or_staff` additionally allows a company to see the display name/email of a student **only if that student applied to one of that company's projects** — not the general student directory.

## 6. Student application privacy

- A student can only ever see and manage their **own** applications (`GET /api/applications/me`, `POST /api/applications/:id/withdraw`) — `applications_select_own_or_project_staff` / `applications_update_own_or_project_owner_or_admin`.
- A student cannot change their own application to `shortlisted`/`selected`/`not_selected` — only `withdrawn` is allowed via `withdrawApplication()`; the other status transitions require `PATCH /api/applications/:id/status` as the owning company or admin.
- `GET /api/applications/:id/decision` lets a student view **their own** `SelectionDecision`, and lets the owning company/teacher/admin view any decision for their project — never a different student's decision (`assertCanViewApplicationDecision`).

## 7. Service role key never reaches the browser

- `lib/supabase/admin.ts` imports the `server-only` package as its first line — any accidental import from a Client Component fails the build.
- `createAdminClient()` is used only inside Route Handlers/server code for privileged, narrowly-scoped work (e.g. `lib/notifications/emit.ts` looking up all teacher profile IDs to fan out a `selection_completed_for_teacher` notification).
- Browser code only ever sees `NEXT_PUBLIC_SUPABASE_URL` and the anon/publishable key via `lib/supabase/client.ts`; `SUPABASE_SERVICE_ROLE_KEY` is not prefixed `NEXT_PUBLIC_*` and is therefore never bundled into client JavaScript by Next.js.

## 8. No draft leakage to public/students

- `projects_select_published_or_owner_or_staff` restricts `status = 'draft'` (and any non-`published` status) projects to the owning company and staff. A student or another company cannot list, fetch, or apply to a draft project — it simply does not appear in `GET /api/projects` results for them, and `GET /api/projects/:id` on a draft ID returns as if it doesn't exist (RLS filters the row before it reaches the handler).
- Project child tables (`project_required_courses`, `project_required_skills`, `project_weights`, etc.) follow the same parent-project visibility rule, so weights/requirements of a draft project are equally hidden.

## 9. Selection capacity

- `enforce_selection_capacity()` (DB trigger, `BEFORE INSERT OR UPDATE` on `selection_decisions`) rejects a `selected` decision once the number of already-`selected` applications for that project reaches `projects.positions`, independent of any application-layer check — this holds even against direct DB access with a non-service role.
- `enforce_project_positions_capacity()` symmetrically blocks lowering `projects.positions` below the number of students already selected.
- The API layer (`lib/selections/service.ts`) pre-checks capacity for a clearer `409 CONFLICT` response before hitting the DB trigger.
- `enforce_selection_application_link()` additionally guarantees a selection decision's `project_id`/`student_id` always match its `application_id`, and blocks selecting a `withdrawn` application.

## 10. Audit trail

- Every sensitive write — project create/update/publish, application create/status-change/shortlist/unshortlist/withdraw, match save/update, selection decide/change/reason-change, notification create — is captured **automatically by Postgres `SECURITY DEFINER` triggers** into `public.audit_events` (`actor_profile_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `created_at`). See `docs/SCHEMA.md` for the full action vocabulary.
- There is no client-controllable way to skip or falsify an audit entry — the actor is always `auth.uid()` at write time, not a client-supplied field.
- Audit history is exposed read-only via `GET /api/audit` (`?limit=`, default 100, max 200), restricted to `teacher`/`admin` by both the route handler and the `audit_events_select_staff` RLS policy.

## Related docs

- `docs/SCHEMA.md` — full table/RLS/trigger reference
- `docs/API.md` — per-route auth requirements
- `docs/MATCHING_ALGORITHM.md` — how scores that feed selections are computed
- `docs/BACKEND_SETUP.md` — env var handling for secrets
