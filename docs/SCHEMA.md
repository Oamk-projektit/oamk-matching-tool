# Database Schema

Canonical Supabase schema for the OAMK Matching Tool.  
Aligned with `docs/API.md` and `types/domain.ts` (projects model).

Migrations: `supabase/migrations/`. Seed: `supabase/seed.sql`.

> **Runtime note:** Live Next.js `/api/opportunities` handlers still use
> `types/legacy.ts` against the previous opportunities vocabulary until route
> migration. After `supabase db reset`, the database is the **projects** model
> documented here.

---

## Design decisions

| Topic | Choice |
|-------|--------|
| Canonical listing unit | `projects` (`company_project` \| `internship`) |
| Ownership | **Only `company`** creates/owns via `projects.company_id` → `companies.id` |
| Teacher | Oversight only (read projects, applications, matches, selections, audit) — **no ownership** |
| Admin | Full administer / override |
| Student | Browse published projects + apply |
| Catalogs | Shared `courses`, `skills`, `interests` |
| Skill links | `project_required_skills` **and** `project_recommended_skills` (both required tables; rows optional) |
| Interest links | `project_interests` (required table; rows optional) |
| Empty optional lists | Must not hurt matching score / cause divide-by-zero (engine rule) |
| Weights | Integer percentages on `project_weights`, **sum = 100** |
| Final choice | `selection_decisions` (matching never auto-selects) |
| Auth link | `profiles.id` = `auth.users.id` |
| Roles | `profiles.role`: `student` \| `company` \| `teacher` \| `admin` |
| Auditing | `audit_events` via triggers |

Legacy `opportunities` tables are dropped by
`20260804140000_drop_legacy_opportunity_schema.sql`.

---

## Enums (check constraints)

| Name | Values |
|------|--------|
| Role | `student`, `company`, `teacher`, `admin` |
| Language | `fi`, `en` |
| Project type | `company_project`, `internship` |
| Project status | `draft`, `published`, `closed`, `archived` |
| Work mode | `onsite`, `hybrid`, `remote` |
| Application status | `submitted`, `under_review`, `shortlisted`, `selected`, `not_selected`, `withdrawn` |
| Selection decision | `selected`, `not_selected` |
| Notification type | `application_received`, `application_status_changed`, `match_ready`, `selection_decided`, `project_published` |

---

## Tables

### `profiles`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| role | text | NOT NULL, CHECK role |
| display_name | text | NOT NULL |
| email | text | NOT NULL |
| preferred_language | text | NOT NULL DEFAULT `fi` |
| created_at / updated_at | timestamptz | NOT NULL |

### `companies` / `company_users`

| Table | Notes |
|-------|-------|
| `companies` | `name`, optional `business_id`, `description`, `website` |
| `company_users` | UNIQUE `(company_id, profile_id)` and UNIQUE `(profile_id)` (MVP: one company per profile); `company_role` `owner` \| `member` |

### `courses` / `skills` / `interests`

Shared catalogs. `courses.credits >= 0`. Skills/interests use `normalized_name` UNIQUE.

### `students`

| Column | Notes |
|--------|-------|
| profile_id | UNIQUE → one student row per profile |
| study_credits | CHECK ≥ 0 |
| preferred_project_types | `text[]` subset of project types |

Child tables:

- `student_courses` — UNIQUE `(student_id, course_id)`; optional completion metadata (`completion_status`, `completed_at`, `grade`, `verified`)
- `student_skills` — UNIQUE `(student_id, skill_id)`; optional `level`
- `student_interests` — UNIQUE `(student_id, interest_id)`

### `projects`

Owned **only** by `company_id` (no teacher owner column). `positions >= 1`, `minimum_study_credits >= 0`.

Children (tables always exist; per-project rows optional):

- `project_required_courses`
- `project_recommended_courses`
- `project_required_skills` (optional `level`)
- `project_recommended_skills` (optional `level`) — missing recommended skills weigh less than required in matching
- `project_interests` — enables structured interest overlap scoring

### `project_weights`

1:1 with project. Integer criteria columns; CHECK sum = 100.

### `applications`

UNIQUE `(student_id, project_id)`. Status enum as above.

### `matches`

UNIQUE `(student_id, project_id)` — one current result per pair.
`total_score` 0–100; `score_breakdown` / `weights_snapshot` jsonb.

### `selection_decisions`

Links to `application_id` (UNIQUE). Trigger enforces application’s
`student_id` / `project_id` match. Teachers cannot INSERT (RLS); admin may.

### `notifications`

`profile_id`, typed `type`, bilingual `title`/`body`, optional `read_at`.

### `audit_events`

`actor_profile_id`, `action`, `entity_type`, `entity_id`, `old_values`,
`new_values`, `created_at`.

Automatic actions include: project create/update/publish, application create/
shortlist/update, match save/update, selection decide/change, notification create.

---

## Integrity highlights

- One student profile per `profiles` row (`students.profile_id` UNIQUE)
- No duplicate student course / skill / interest
- No duplicate application to same project
- No duplicate current match for student–project
- Project weights sum to 100
- Selection must reference a real application for that student+project
- Positions ≥ 1; study/course credits ≥ 0

---

## Relationships

```text
auth.users 1──1 profiles
profiles 1──0..1 students
profiles 1──0..1 company_users ──* companies
companies 1──* projects
projects 1──1 project_weights
projects 1──* applications / matches / selection_decisions
students 1──* applications / matches / student_*
```

---

## Row Level Security

RLS enabled on all public application tables.

Helpers: `current_user_role`, `is_admin`, `is_teacher`, `is_teacher_or_admin`,
`is_company_role`, `is_student`, `owns_student_row`, `member_of_company`,
`owns_project`, `can_view_project_staff`.

| Concern | Policy |
|---------|--------|
| Student profile / courses / skills / interests | Own CRUD |
| Published projects + weights | Readable by authenticated |
| Draft projects | Owner company / teacher / admin |
| Project INSERT/UPDATE/DELETE | **Company member with role=company** (or admin); teachers cannot create |
| Applications | Own student **or** own-project company / teacher / admin |
| Matches | Own student row **or** project staff (student never sees peers) |
| Selection | Company on own projects + admin write; teachers read-only |
| Audit | Teacher / admin SELECT |
| Cross-company | Company A cannot see company B applicants |

Service role bypasses RLS for server-side jobs.

---

## Applying locally

```bash
supabase db reset   # migrations + seed.sql
supabase db lint    # if CLI available
```

SQL checks: `supabase/tests/schema_check.sql`, `supabase/tests/integrity_check.sql`.

---

## Seed

`supabase/seed.sql`: 5 students, 2 companies, 7 projects (incl. draft),
catalogs, applications, matches, one selection, sample notifications.
Local demo password: `LocalDemoOnly!1` (fictional, local Auth only).
