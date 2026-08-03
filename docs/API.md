# API Contract — OAMK Matching Tool

Shared REST contract for Tommi (backend) and Venla (frontend).  
All routes live under the Next.js App Router prefix `/api`.

Base URL (local): `http://localhost:3000/api`

---

## Conventions

| Topic | Rule |
|--------|------|
| Format | JSON request and response bodies |
| IDs | UUID strings |
| Timestamps | ISO 8601 UTC (`timestamptz`) |
| Auth | Supabase Auth Bearer cookie/session; API routes validate the user |
| Roles | `student` \| `teacher` \| `admin` (from `profiles.role`) |
| Errors | Uniform envelope (see below) |
| Naming | English field names, snake_case in JSON to match DB |

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "name is required",
    "details": [{ "field": "name", "message": "Required" }]
  }
}
```

| HTTP | Typical `code` |
|------|----------------|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL_ERROR` |

### Success list envelope (optional for list endpoints)

```json
{
  "data": [],
  "meta": { "count": 0 }
}
```

Single-resource endpoints may return the resource object directly.

---

## Domain summary

Canonical TypeScript types: `types/domain.ts`, `types/api.ts`.  
Database: `docs/SCHEMA.md`.

| Concept | Description |
|---------|-------------|
| **Student** | Profile + courses, skills, interests, preferences |
| **Opportunity** | Project or internship (`type`) with requirements and weights |
| **Application** | Student applies to an opportunity |
| **Match** | Deterministic score 0–100 with explanation fields |

---

## Health

### `GET /api/health`

No auth required.

**Response `200`**

```json
{
  "status": "ok",
  "service": "oamk-matching-tool",
  "timestamp": "2026-08-03T12:00:00.000Z",
  "supabase": "configured"
}
```

`supabase` is `"configured"` when env vars are present, otherwise `"missing"`. Does not open a DB connection in the cheap health check.

---

## Current user

### `GET /api/me`

**Auth:** required  
**Response `200`**

```json
{
  "user_id": "33333333-3333-3333-3333-333333333333",
  "email": "aino.virtanen@students.oamk.fi",
  "role": "student",
  "student_id": "22222222-2222-2222-2222-222222222222"
}
```

`student_id` is `null` until a student profile row exists.

---

## Students

### `GET /api/students`

**Auth:** teacher or admin  
**Response `200`:** `{ "data": [ Student ], "meta": { "count": n } }`

### `GET /api/students/:id`

**Auth:** owning student, teacher, or admin  
**Response `200`:** `Student`  
**Errors:** `404` if missing

### `POST /api/students`

**Auth:** authenticated user creating own student profile (role student), or admin  
**Body:** `CreateStudentRequest`

```json
{
  "name": "Aino Virtanen",
  "email": "aino.virtanen@students.oamk.fi",
  "degree_program": "Tietotekniikka",
  "credits": 120,
  "language": "FI",
  "availability": "Full-time",
  "completed_courses": ["Web-ohjelmointi", "Tietokannat"],
  "skills": ["React", "TypeScript", "SQL"],
  "interests": ["Web development", "UX"],
  "project_preferences": ["project", "internship"]
}
```

**Response `201`:** `Student`

### `PUT /api/students/:id`

**Auth:** owning student or admin  
**Body:** `UpdateStudentRequest` (partial allowed)  
**Response `200`:** `Student`

Nested arrays (`completed_courses`, `skills`, `interests`, `project_preferences`), when present, **replace** the previous set.

---

## Opportunities (projects & internships)

Unified resource. Field `type` is `"project"` or `"internship"`.

### `GET /api/opportunities`

**Auth:** any authenticated user (students may browse)  
**Query (optional):**

| Param | Description |
|-------|-------------|
| `type` | `project` \| `internship` |
| `q` | Case-insensitive search in name/description |

**Response `200`:** `{ "data": [ Opportunity ], "meta": { "count": n } }`

### `GET /api/opportunities/:id`

**Auth:** authenticated  
**Response `200`:** `Opportunity`

### `POST /api/opportunities`

**Auth:** teacher or admin  
**Body:** `CreateOpportunityRequest`

```json
{
  "name": "Campus portal renewal",
  "description": "Rebuild student-facing portal UI.",
  "type": "project",
  "required_courses": ["Web-ohjelmointi"],
  "recommended_courses": ["Käyttöliittymäsuunnittelu"],
  "minimum_credits": 60,
  "required_language": "FI",
  "schedule": "Flexible",
  "duration": "3 months",
  "required_skills": ["React", "TypeScript"],
  "student_slots": 2,
  "weights": {
    "courses": 0.3,
    "skills": 0.4,
    "language": 0.1,
    "schedule": 0.1,
    "credits": 0.1
  }
}
```

**Response `201`:** `Opportunity`

Default weights (must sum to 1.0): courses 0.3, skills 0.4, language 0.1, schedule 0.1, credits 0.1.

### `PUT /api/opportunities/:id`

**Auth:** owning teacher or admin  
**Body:** `UpdateOpportunityRequest`  
**Response `200`:** `Opportunity`

### `DELETE /api/opportunities/:id`

**Auth:** owning teacher or admin  
**Response `204`:** empty body

---

## Applications

### `POST /api/applications`

**Auth:** student (own profile)  
**Body:**

```json
{
  "opportunity_id": "11111111-1111-1111-1111-111111111111",
  "message": "I am interested in this project."
}
```

**Response `201`:** `Application`  
**Errors:** `409` if duplicate application for same pair

### `GET /api/opportunities/:id/applicants`

**Auth:** opportunity owner (teacher) or admin  
**Response `200`:**

```json
{
  "data": [
    {
      "application": { "id": "...", "status": "pending", "created_at": "..." },
      "student": { "id": "...", "name": "...", "email": "..." },
      "match": { "score": 85, "explanation": "..." }
    }
  ],
  "meta": { "count": 1 }
}
```

Applicants are sorted by match score descending when a match exists; otherwise by `created_at`.

### `GET /api/applications/me`

**Auth:** student  
**Response `200`:** `{ "data": [ ApplicationWithOpportunity ], "meta": { "count": n } }`

---

## Matching

Score is an integer **0–100**. Algorithm is deterministic: same inputs → same score and explanation.

### `POST /api/matches/run/:studentId`

**Auth:** owning student, teacher, or admin  
Runs matching against all opportunities (or filtered set) and upserts `matches` rows.

**Optional body:**

```json
{
  "opportunity_ids": ["..."]
}
```

**Response `200`:**

```json
{
  "data": [ MatchResult ],
  "meta": { "count": 3, "student_id": "..." }
}
```

Results sorted by `score` descending. MVP UIs typically show top 3.

### `GET /api/matches/:studentId`

**Auth:** owning student, teacher, or admin  
**Query:** `limit` (default 10, max 50)  
**Response `200`:** `{ "data": [ MatchResult ], "meta": { "count": n } }`

### `GET /api/opportunities/:id/matches`

**Auth:** opportunity owner or admin  
**Response `200`:** `{ "data": [ MatchResult ], "meta": { "count": n } }`

### `MatchResult` shape

```json
{
  "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "student_id": "...",
  "opportunity_id": "...",
  "score": 85,
  "matched_courses": ["Web-ohjelmointi"],
  "missing_courses": ["Tietokannat"],
  "matched_skills": ["React", "TypeScript"],
  "missing_skills": ["Supabase"],
  "explanation": "Strong skill overlap; one required course missing.",
  "recommendation": "Complete Tietokannat before the project starts.",
  "created_at": "2026-08-03T12:00:00.000Z",
  "updated_at": "2026-08-03T12:00:00.000Z"
}
```

---

## Auth & roles (backend)

| Action | student | teacher | admin |
|--------|---------|---------|-------|
| Read own student profile | yes | — | yes |
| Read all students | no | yes | yes |
| Create/update own student | yes | no | yes |
| Browse opportunities | yes | yes | yes |
| Create/update/delete own opportunities | no | yes | yes |
| Apply to opportunity | yes | no | no |
| See applicants for own opportunity | no | yes | yes |
| Run/read own matches | yes | yes* | yes |

\* Teachers may run/read matches for students in context of their opportunities.

Role source of truth: `profiles.role`. Legacy `roles` table is not used.

---

## Example resources

### Student

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "user_id": "33333333-3333-3333-3333-333333333333",
  "name": "Aino Virtanen",
  "email": "aino.virtanen@students.oamk.fi",
  "degree_program": "Tietotekniikka",
  "credits": 120,
  "language": "FI",
  "availability": "Full-time",
  "completed_courses": ["Web-ohjelmointi", "Tietokannat"],
  "skills": ["React", "TypeScript", "SQL"],
  "interests": ["Web development"],
  "project_preferences": ["project"],
  "created_at": "2026-08-01T10:00:00.000Z",
  "updated_at": "2026-08-01T10:00:00.000Z"
}
```

### Opportunity

```json
{
  "id": "44444444-4444-4444-4444-444444444444",
  "teacher_id": "55555555-5555-5555-5555-555555555555",
  "name": "Campus portal renewal",
  "description": "Rebuild student-facing portal UI.",
  "type": "project",
  "required_courses": ["Web-ohjelmointi"],
  "recommended_courses": ["Käyttöliittymäsuunnittelu"],
  "minimum_credits": 60,
  "required_language": "FI",
  "schedule": "Flexible",
  "duration": "3 months",
  "required_skills": ["React", "TypeScript"],
  "student_slots": 2,
  "weights": {
    "courses": 0.3,
    "skills": 0.4,
    "language": 0.1,
    "schedule": 0.1,
    "credits": 0.1
  },
  "created_at": "2026-08-01T10:00:00.000Z",
  "updated_at": "2026-08-01T10:00:00.000Z"
}
```

---

## Frontend integration notes

- Venla should call these `/api/*` paths from a thin service layer.
- Sprint 1 UI still uses “projects” wording; map UI “project” ↔ API `Opportunity` with `type`.
- Temporary adapters (if ever needed) belong under `lib/integration/` and must be listed in `docs/VENLA_TASKS.md`.

See also: `docs/SCHEMA.md`, `docs/BACKEND.md`, `types/domain.ts`, `types/api.ts`.
