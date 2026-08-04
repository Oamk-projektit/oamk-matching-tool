# Database Schema

> **Status:** This document describes the **currently deployed** Supabase schema
> (`opportunities`, teacher-owned rows, snake_case API legacy).
>
> Canonical target models are locked in `types/domain.ts`, `types/api.ts`, and
> `docs/API.md` (`projects`, `company` role, applications statuses, selection
> decisions, weights summing to 100). A schema migration will rewrite this file.

Canonical Supabase schema for the OAMK Matching Tool (runtime).  
Target contract: `docs/API.md` and `types/domain.ts`. Legacy runtime types: `types/legacy.ts`.

Migrations live in `supabase/migrations/`. Seed data: `supabase/seed.sql`.

---

## Design decisions (vs Sprint 1 draft)

| Old (Sprint 1) | New (MVP contract) | Reason |
|----------------|--------------------|--------|
| `projects` + `project_skills` | `opportunities` + related tables | Unified project/internship model |
| `skills` / `interests` | `student_skills` / `student_interests` | Clear ownership naming |
| — | `student_courses`, `student_project_preferences` | Matching inputs from #101 |
| — | `applications` | Student applications (#126 / #133) |
| `matches.score` float 0–1 | integer 0–100 + explanation fields | Shared matching contract (#103) |
| `roles` table | dropped; use `profiles.role` | Single source of truth |
| `timestamp` | `timestamptz` + `updated_at` | Consistent UTC auditing |

---

## Enums (check constraints)

| Name | Values |
|------|--------|
| Role | `student`, `teacher`, `admin` |
| Language | `FI`, `EN` |
| Opportunity type | `project`, `internship` |
| Application status | `pending`, `accepted`, `rejected`, `withdrawn` |

---

## Tables

### `profiles`

Auth-linked role metadata. One row per auth user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, `gen_random_uuid()` | Row id |
| user_id | uuid | UNIQUE, NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Auth user |
| role | text | NOT NULL, DEFAULT `'student'`, CHECK role | App role |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | Created |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | Updated |

### `students`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Student id |
| user_id | uuid | UNIQUE, NOT NULL, FK → `auth.users` | Owner |
| name | text | NOT NULL | Display name |
| email | text | NOT NULL | Contact email |
| degree_program | text | | e.g. Tietotekniikka |
| credits | integer | NOT NULL, DEFAULT 0, CHECK ≥ 0 | Completed credits |
| language | text | NOT NULL, DEFAULT `'FI'`, CHECK | Preferred language |
| availability | text | | e.g. Full-time |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `student_courses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| course_name | text | NOT NULL |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, course_name)`.

### `student_skills`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| skill_name | text | NOT NULL |
| level | text | nullable skill level label |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, skill_name)`.

### `student_interests`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| interest_name | text | NOT NULL |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, interest_name)`.

### `student_project_preferences`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| preference | text | NOT NULL, CHECK `project` \| `internship` |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, preference)`.

### `opportunities`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| teacher_id | uuid | NOT NULL, FK → `auth.users` | Owner teacher |
| name | text | NOT NULL | |
| description | text | | |
| type | text | NOT NULL, CHECK project/internship | |
| minimum_credits | integer | NOT NULL, DEFAULT 0, CHECK ≥ 0 | |
| required_language | text | NOT NULL, DEFAULT `'FI'` | |
| schedule | text | | Full-time / Flexible / … |
| duration | text | | e.g. 3 months |
| student_slots | integer | NOT NULL, DEFAULT 1, CHECK ≥ 1 | |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `opportunity_required_courses`

UNIQUE `(opportunity_id, course_name)`.

### `opportunity_recommended_courses`

UNIQUE `(opportunity_id, course_name)`.

### `opportunity_required_skills`

| Extra | `level` text nullable |

UNIQUE `(opportunity_id, skill_name)`.

### `opportunity_weights`

One row per opportunity (1:1).

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| opportunity_id | uuid | UNIQUE, NOT NULL, FK CASCADE |
| weight_courses | numeric(4,3) | NOT NULL, DEFAULT 0.300 |
| weight_skills | numeric(4,3) | NOT NULL, DEFAULT 0.400 |
| weight_language | numeric(4,3) | NOT NULL, DEFAULT 0.100 |
| weight_schedule | numeric(4,3) | NOT NULL, DEFAULT 0.100 |
| weight_credits | numeric(4,3) | NOT NULL, DEFAULT 0.100 |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` |

CHECK: weights ≥ 0 and sum ≈ 1.000 (tolerance via check on rounded sum = 1.000).

### `applications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | NOT NULL, FK → `students` CASCADE | |
| opportunity_id | uuid | NOT NULL, FK → `opportunities` CASCADE | |
| status | text | NOT NULL, DEFAULT `'pending'` | Application status |
| message | text | | Optional cover note |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

UNIQUE `(student_id, opportunity_id)`.

### `matches`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| student_id | uuid | NOT NULL, FK → `students` CASCADE | |
| opportunity_id | uuid | NOT NULL, FK → `opportunities` CASCADE | |
| score | integer | NOT NULL, CHECK 0–100 | Compatibility |
| matched_courses | text[] | NOT NULL, DEFAULT `'{}'` | |
| missing_courses | text[] | NOT NULL, DEFAULT `'{}'` | |
| matched_skills | text[] | NOT NULL, DEFAULT `'{}'` | |
| missing_skills | text[] | NOT NULL, DEFAULT `'{}'` | |
| explanation | text | NOT NULL, DEFAULT `''` | Human-readable |
| recommendation | text | NOT NULL, DEFAULT `''` | Next step advice |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

UNIQUE `(student_id, opportunity_id)`.

### `notifications` (MVP storage only)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| recipient_user_id | uuid | NOT NULL, FK → `auth.users` CASCADE |
| type | text | NOT NULL |
| content | text | NOT NULL |
| read | boolean | NOT NULL, DEFAULT false |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

---

## Relationships

```text
auth.users 1──1 profiles
auth.users 1──1 students
auth.users 1──* opportunities (as teacher_id)

students 1──* student_courses
students 1──* student_skills
students 1──* student_interests
students 1──* student_project_preferences
students 1──* applications
students 1──* matches

opportunities 1──* opportunity_required_courses
opportunities 1──* opportunity_recommended_courses
opportunities 1──* opportunity_required_skills
opportunities 1──1 opportunity_weights
opportunities 1──* applications
opportunities 1──* matches
```

---

## Indexes

| Index | Table | Columns |
|-------|-------|---------|
| `idx_profiles_user_id` | profiles | user_id |
| `idx_profiles_role` | profiles | role |
| `idx_students_user_id` | students | user_id |
| `idx_students_email` | students | email |
| `idx_student_courses_student_id` | student_courses | student_id |
| `idx_student_skills_student_id` | student_skills | student_id |
| `idx_student_interests_student_id` | student_interests | student_id |
| `idx_opportunities_teacher_id` | opportunities | teacher_id |
| `idx_opportunities_type` | opportunities | type |
| `idx_applications_student_id` | applications | student_id |
| `idx_applications_opportunity_id` | applications | opportunity_id |
| `idx_applications_status` | applications | status |
| `idx_matches_student_id` | matches | student_id |
| `idx_matches_opportunity_id` | matches | opportunity_id |
| `idx_matches_score` | matches | score DESC |
| `idx_notifications_recipient` | notifications | recipient_user_id |

---

## Triggers

Shared function `public.set_updated_at()` sets `NEW.updated_at = now()` on UPDATE.

Applied to: `profiles`, `students`, `opportunities`, `opportunity_weights`, `applications`, `matches`.

Optional: `handle_new_user` trigger on `auth.users` inserts a default `profiles` row (`role = student`). Implemented in migrations.

---

## Row Level Security

RLS is enabled on all public tables. Helper functions (SECURITY DEFINER):

| Function | Returns |
|----------|---------|
| `public.current_user_role()` | text role or null |
| `public.is_admin()` | boolean |
| `public.is_teacher()` | boolean |
| `public.is_student()` | boolean |

### Policy summary

| Table | student | teacher | admin |
|-------|---------|---------|-------|
| profiles | read/update own | read/update own | all |
| students | CRUD own | SELECT all | all |
| student_* child tables | CRUD own via student | SELECT all | all |
| opportunities | SELECT all | INSERT; UPDATE/DELETE own | all |
| opportunity_* children | SELECT all | mutate when owns parent | all |
| applications | INSERT own; SELECT own | SELECT for own opportunities | all |
| matches | SELECT own | SELECT for own opportunities | all |
| notifications | SELECT/UPDATE own | SELECT/UPDATE own | all |

Service role (API server with `SUPABASE_SERVICE_ROLE_KEY`) bypasses RLS for privileged server-side operations. Prefer user-scoped clients when possible.

Full SQL: `supabase/migrations/*_rls_policies.sql`.

---

## Applying locally

```bash
# With Supabase CLI
supabase db reset   # applies migrations + seed.sql
```

Or run migration files in order in the Supabase SQL editor.

---

## Seed data

`supabase/seed.sql` inserts demo students, opportunities, applications, and sample matches for local/dev. It assumes local Auth users with fixed UUIDs (see seed file header).
