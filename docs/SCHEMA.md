# Database Schema (canonical target)

<!--
TOMMI — Locked with types/domain.ts and docs/API.md.
Migrations are intentionally NOT applied in this documentation phase.
-->

Target Supabase schema for the OAMK Matching Tool.  
Aligned with `types/domain.ts` and `docs/API.md`.

| Layer | Status |
|-------|--------|
| Domain + API contract | Locked |
| This SCHEMA document | Locked (target) |
| SQL migrations | **Not in this phase** |
| Live DB | Still on legacy `opportunities` (`types/legacy.ts`) |

DB columns use **snake_case**. JSON/API uses **camelCase**.

---

## Naming decisions

| Decision | Value |
|----------|--------|
| Canonical project table | `projects` |
| Type discriminator | `project_type` |
| MVP types | `company_project`, `internship` |
| Thesis | Out of first MVP |
| Applications | Required (`applications`) |
| Role source | `profiles.role` |
| Roles | `student`, `company`, `teacher`, `admin` |
| Final student choice | Company via `selection_decisions` |
| Matching | Scores only — never auto-selects |
| Top 3 visibility | company, teacher, admin |
| Student match visibility | Own result only (+ criteria/weights) |

---

## Enums (check constraints / enums)

| Name | Values |
|------|--------|
| Role | `student`, `company`, `teacher`, `admin` |
| Preferred language | `fi`, `en` |
| Project type | `company_project`, `internship` |
| Project status | `draft`, `published`, `closed`, `archived` |
| Work mode | `onsite`, `hybrid`, `remote` |
| Application status | `submitted`, `under_review`, `shortlisted`, `selected`, `not_selected`, `withdrawn` |
| Selection decision | `selected`, `not_selected` |
| Company user role | `owner`, `member` |

---

## Tables

### `profiles`

Auth-linked identity. One row per auth user. **`role` is the canonical role source.**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default `gen_random_uuid()` | Profile id (= domain `Profile.id`) |
| user_id | uuid | UNIQUE, NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | Auth user |
| role | text | NOT NULL, CHECK role | App role |
| display_name | text | NOT NULL | Display name |
| email | text | NOT NULL | Contact email |
| preferred_language | text | NOT NULL, DEFAULT `'fi'`, CHECK | UI/content language |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `companies`

Organization that owns projects and makes final selections.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Company id |
| name | text | NOT NULL | Legal / display name |
| business_id | text | nullable | Y-tunnus or equivalent |
| description | text | nullable | |
| website | text | nullable | |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `company_users`

Links profiles with role `company` to a company.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| company_id | uuid | NOT NULL, FK → `companies` CASCADE | |
| profile_id | uuid | NOT NULL, FK → `profiles` CASCADE | |
| company_role | text | NOT NULL, DEFAULT `'member'`, CHECK | `owner` \| `member` |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |

UNIQUE `(company_id, profile_id)`.

### `students`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| profile_id | uuid | UNIQUE, NOT NULL, FK → `profiles` CASCADE | Owner profile |
| degree_programme | text | nullable | |
| department | text | nullable | |
| study_credits | integer | NOT NULL, DEFAULT 0, CHECK ≥ 0 | |
| availability_start | date | nullable | |
| availability_end | date | nullable | |
| preferred_project_types | text[] | NOT NULL, DEFAULT `'{}'` | `company_project` / `internship` |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `courses`

Shared course catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| code | text | UNIQUE, NOT NULL | e.g. `TT00AA11` |
| name_fi | text | NOT NULL | |
| name_en | text | NOT NULL | |
| credits | integer | NOT NULL, CHECK ≥ 0 | |
| department | text | nullable | |
| active | boolean | NOT NULL, DEFAULT true | |

### `skills`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name_fi | text | NOT NULL |
| name_en | text | NOT NULL |
| normalized_name | text | UNIQUE, NOT NULL |

### `interests`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name_fi | text | NOT NULL |
| name_en | text | NOT NULL |
| normalized_name | text | UNIQUE, NOT NULL |

### `student_courses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| course_id | uuid | NOT NULL, FK → `courses` CASCADE |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, course_id)`.

### `student_skills`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| skill_id | uuid | NOT NULL, FK → `skills` CASCADE |
| level | text | nullable |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, skill_id)`.

### `student_interests`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| student_id | uuid | NOT NULL, FK → `students` CASCADE |
| interest_id | uuid | NOT NULL, FK → `interests` CASCADE |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |

UNIQUE `(student_id, interest_id)`.

### `projects`

Canonical table for company projects and internships.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| company_id | uuid | NOT NULL, FK → `companies` | Owner company |
| title | text | NOT NULL | |
| description | text | NOT NULL | |
| project_type | text | NOT NULL, CHECK | `company_project` \| `internship` |
| status | text | NOT NULL, DEFAULT `'draft'`, CHECK | |
| positions | integer | NOT NULL, DEFAULT 1, CHECK ≥ 1 | Open seats |
| application_start | date | nullable | |
| application_deadline | date | nullable | |
| project_start | date | nullable | |
| project_end | date | nullable | |
| work_mode | text | NOT NULL, DEFAULT `'hybrid'`, CHECK | |
| location | text | nullable | |
| remote_allowed | boolean | NOT NULL, DEFAULT false | |
| minimum_study_credits | integer | NOT NULL, DEFAULT 0, CHECK ≥ 0 | |
| required_language | text | NOT NULL, DEFAULT `'fi'`, CHECK | |
| department | text | nullable | |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `project_required_courses`

UNIQUE `(project_id, course_id)`. FK → `projects`, `courses` CASCADE.

### `project_recommended_courses`

UNIQUE `(project_id, course_id)`. FK → `projects`, `courses` CASCADE.

### `project_required_skills`

UNIQUE `(project_id, skill_id)`. FK → `projects`, `skills` CASCADE. Optional `level` text.

### `project_recommended_skills`

UNIQUE `(project_id, skill_id)`. FK → `projects`, `skills` CASCADE.

### `project_interests` (optional join)

UNIQUE `(project_id, interest_id)`. Links project to catalog interests for matching.

### `project_weights`

One row per project (1:1). Integer percentages; **must sum to 100**.

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| project_id | uuid | UNIQUE, NOT NULL, FK → `projects` CASCADE |
| study_credits | integer | NOT NULL, DEFAULT 10, CHECK ≥ 0 |
| required_courses | integer | NOT NULL, DEFAULT 20, CHECK ≥ 0 |
| recommended_courses | integer | NOT NULL, DEFAULT 10, CHECK ≥ 0 |
| skills | integer | NOT NULL, DEFAULT 25, CHECK ≥ 0 |
| language | integer | NOT NULL, DEFAULT 10, CHECK ≥ 0 |
| availability | integer | NOT NULL, DEFAULT 10, CHECK ≥ 0 |
| interests | integer | NOT NULL, DEFAULT 10, CHECK ≥ 0 |
| degree_programme | integer | NOT NULL, DEFAULT 5, CHECK ≥ 0 |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` |

CHECK: sum of weight columns = **100**.

### `applications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | NOT NULL, FK → `projects` CASCADE | |
| student_id | uuid | NOT NULL, FK → `students` CASCADE | |
| status | text | NOT NULL, DEFAULT `'submitted'`, CHECK | Application status |
| message | text | nullable | Cover note |
| submitted_at | timestamptz | NOT NULL, DEFAULT `now()` | |
| updated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

UNIQUE `(project_id, student_id)`.

### `matches`

Deterministic compatibility result. Does **not** imply selection.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | NOT NULL, FK → `projects` CASCADE | |
| student_id | uuid | NOT NULL, FK → `students` CASCADE | |
| total_score | integer | NOT NULL, CHECK 0–100 | |
| score_breakdown | jsonb | NOT NULL | Per-criterion contributions |
| matched_courses | text[] | NOT NULL, DEFAULT `'{}'` | |
| missing_required_courses | text[] | NOT NULL, DEFAULT `'{}'` | |
| matched_skills | text[] | NOT NULL, DEFAULT `'{}'` | |
| missing_required_skills | text[] | NOT NULL, DEFAULT `'{}'` | |
| explanation | text | NOT NULL, DEFAULT `''` | |
| weights_snapshot | jsonb | NOT NULL | Copy of weights at calculation time |
| calculated_at | timestamptz | NOT NULL, DEFAULT `now()` | |

UNIQUE `(project_id, student_id)`.

### `selection_decisions`

Company’s final student choice. Written only by company owner/member or admin.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| project_id | uuid | NOT NULL, FK → `projects` CASCADE | |
| student_id | uuid | NOT NULL, FK → `students` CASCADE | |
| application_id | uuid | NOT NULL, FK → `applications` CASCADE | |
| decision | text | NOT NULL, CHECK | `selected` \| `not_selected` |
| decided_by | uuid | NOT NULL, FK → `profiles` | Actor profile |
| reason | text | nullable | |
| decided_at | timestamptz | NOT NULL, DEFAULT `now()` | |

UNIQUE `(project_id, application_id)`.

### `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| profile_id | uuid | NOT NULL, FK → `profiles` CASCADE | Recipient |
| type | text | NOT NULL | Notification type |
| language | text | NOT NULL, CHECK `fi`\|`en` | Body language |
| title | text | NOT NULL | |
| body | text | NOT NULL | |
| read_at | timestamptz | nullable | Null = unread |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |

### `audit_events`

Append-only audit trail for sensitive actions (selection, status changes, weight changes).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | |
| actor_profile_id | uuid | nullable, FK → `profiles` | Null if system |
| action | text | NOT NULL | e.g. `selection.created` |
| entity_type | text | NOT NULL | e.g. `project`, `application` |
| entity_id | uuid | NOT NULL | |
| payload | jsonb | NOT NULL, DEFAULT `'{}'` | |
| created_at | timestamptz | NOT NULL, DEFAULT `now()` | |

---

## Relationships

```text
auth.users 1──1 profiles
profiles 1──1 students
profiles *──* companies          via company_users
companies 1──* projects
projects 1──1 project_weights
projects 1──* project_required_courses / project_recommended_courses
projects 1──* project_required_skills / project_recommended_skills
projects 1──* applications
projects 1──* matches
projects 1──* selection_decisions
students 1──* student_courses / student_skills / student_interests
students 1──* applications / matches
profiles 1──* notifications
```

---

## Indexes (planned)

| Index | Table | Columns |
|-------|-------|---------|
| `idx_profiles_user_id` | profiles | user_id |
| `idx_profiles_role` | profiles | role |
| `idx_company_users_profile_id` | company_users | profile_id |
| `idx_company_users_company_id` | company_users | company_id |
| `idx_students_profile_id` | students | profile_id |
| `idx_courses_code` | courses | code |
| `idx_skills_normalized_name` | skills | normalized_name |
| `idx_interests_normalized_name` | interests | normalized_name |
| `idx_projects_company_id` | projects | company_id |
| `idx_projects_project_type` | projects | project_type |
| `idx_projects_status` | projects | status |
| `idx_applications_project_id` | applications | project_id |
| `idx_applications_student_id` | applications | student_id |
| `idx_applications_status` | applications | status |
| `idx_matches_project_id` | matches | project_id |
| `idx_matches_student_id` | matches | student_id |
| `idx_matches_total_score` | matches | total_score DESC |
| `idx_selection_decisions_project_id` | selection_decisions | project_id |
| `idx_notifications_profile_id` | notifications | profile_id |
| `idx_audit_events_entity` | audit_events | entity_type, entity_id |

---

## RLS principles (planned)

RLS on all public tables. Helpers (SECURITY DEFINER): `current_user_role()`, `is_admin()`, `is_teacher()`, `is_company()`, `is_student()`, `user_company_ids()`.

| Concern | Rule |
|---------|------|
| Profiles | Users read/update own; staff read as needed |
| Students | Own CRUD; teacher/admin SELECT |
| Companies / company_users | Members manage own company; teacher/admin read |
| Projects | Published readable by authenticated; mutate by company members / admin |
| Applications | Student inserts/reads own; company/teacher/admin read for relevant projects |
| Matches | Student reads **own** rows only; company/teacher/admin read project matches + Top 3 |
| Selection decisions | Company members / admin write; teacher/admin read |
| Notifications | Recipient only |
| Audit events | Admin read; inserts via service role / trusted API |

Service role bypasses RLS for privileged server routes.

---

## Migration note

Do **not** apply SQL in this documentation phase.  
Next Tommi phase: write ordered migrations under `supabase/migrations/`, then rewrite seed and retire `types/legacy.ts` / `/api/opportunities`.

Legacy live schema (current DB) remains documented historically in git history prior to this lock; runtime still uses `opportunities` until migration.
