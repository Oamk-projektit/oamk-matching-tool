# API Contract — OAMK Matching Tool

<!--
SHARED — Tommi + Venla
Canonical contract for the live projects-model schema (MVP complete).
-->

Shared REST contract for Tommi (backend) and Venla (frontend).  
Canonical TypeScript: `types/domain.ts`, `types/api.ts`.

**Runtime note:** The **projects model is live**. All routes documented below run against the current schema (`supabase/migrations/20260804*`). Legacy `/api/opportunities` handlers return **410 Gone** and point callers at `/api/projects`. Keep `types/legacy.ts` only for older unit helpers — do not call opportunities from new code.

Base URL (local): `http://localhost:3000/api`

---

## Conventions

| Topic | Rule |
|--------|------|
| Format | JSON request and response bodies |
| IDs | UUID strings |
| Timestamps | ISO 8601 UTC |
| Auth | Supabase Auth cookie **or** `Authorization: Bearer <access_token>` |
| Roles | `student` \| `company` \| `teacher` \| `admin` from `profiles.role` |
| Naming | camelCase in JSON and TypeScript; DB columns stay snake_case |
| Success | Always `{ "data": ..., "meta": ... }` |
| Errors | Uniform `{ "error": { "code", "message", "details?" } }` |

### Success envelope

```json
{
  "data": {},
  "meta": {}
}
```

- Single resource: `data` is an object; `meta` may be `{}`.
- List: `data` is an array; `meta` includes at least `{ "count": n }`.

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": []
  }
}
```

`details` is an array of `{ "field": string, "message": string }` when field-level errors exist; otherwise `[]` or omitted.

| HTTP | Typical `code` |
|------|----------------|
| 400 | `VALIDATION_ERROR` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 500 | `INTERNAL_ERROR` |

---

## Roles and permissions

Canonical role source: **`profiles.role`**.

| Role | Purpose |
|------|---------|
| `student` | Profile, browse projects, apply, see own match only |
| `company` | Own projects, see Top 3 / applicants, final student selection |
| `teacher` | Oversight: projects, applicants, Top 3, matches (no final selection) |
| `admin` | Full access |

| Action | student | company | teacher | admin |
|--------|---------|---------|---------|-------|
| Read/update own profile | yes | yes | yes | yes |
| CRUD own student profile | yes | — | — | yes |
| Browse published projects | yes | yes | yes | yes |
| Create/update/archive own projects | — | yes | — | yes |
| Apply to project | yes | — | — | — |
| See own match result | yes | — | —* | yes |
| See Top 3 / ranked applicants | — | own projects | yes | yes |
| Final selection decision | — | own projects | — | yes |
| Run matching | own | own projects | yes | yes |
| Audit read | — | — | yes | yes |

\* Teachers may inspect matches and applicants for oversight but **never create or own** projects in MVP (`projects.company_id` only).

### Privacy model

- Matching **never** auto-selects a student.
- **Company** makes the final `SelectionDecision`.
- **Top 3** (and ranked applicant lists) are visible only to **company**, **teacher**, and **admin**.
- A **student** sees only their **own** match result for a project.
- Students may see **criteria and weights** for transparency.
- Students must **not** see other applicants’ scores, ranks, or identities.

---

## Domain models

| Model | Notes |
|-------|--------|
| **Profile** | Auth-linked identity + `role` |
| **Student** | Study metadata linked via `profileId` |
| **Course / Skill / Interest** | Shared catalogs for matching inputs |
| **Project** | Canonical table for company projects and internships (`projectType`) |
| **ProjectWeights** | Integer percentages; **must sum to 100** |
| **Application** | Student application to a project |
| **Match** | Deterministic score 0–100 + breakdown + explanation |
| **SelectionDecision** | Company’s final choice |
| **Notification** | In-app notification |

MVP `projectType` values: `company_project` \| `internship`.  
Thesis topics are **out of** the first MVP.

Application statuses: `submitted` \| `under_review` \| `shortlisted` \| `selected` \| `not_selected` \| `withdrawn`.

Default weights (`DEFAULT_PROJECT_WEIGHTS`):

| Criterion | Weight |
|-----------|--------|
| studyCredits | 10 |
| requiredCourses | 20 |
| recommendedCourses | 10 |
| skills | 25 |
| language | 10 |
| availability | 10 |
| interests | 10 |
| degreeProgramme | 5 |
| **Total** | **100** |

---

## Health

### `GET /api/health`

No auth. Always probes database connectivity with a cheap privileged query.

**Response `200`**

```json
{
  "data": {
    "status": "ok",
    "service": "oamk-matching-tool",
    "database": "connected",
    "timestamp": "2026-08-04T12:00:00.000Z"
  },
  "meta": {}
}
```

**Response `503`** when env is missing or the database is unreachable:

```json
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY..."
  }
}
```

(`DATABASE_ERROR` is used when env is present but the database probe fails.)

---

## Current user

### `GET /api/me`

**Auth:** required

```json
{
  "data": {
    "profile": {
      "id": "90000000-0000-4000-8000-000000000001",
      "role": "student",
      "displayName": "Aino Virtanen",
      "email": "aino.virtanen@students.oamk.fi",
      "preferredLanguage": "fi",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    },
    "studentId": "s0000000-0000-4000-8000-000000000001",
    "companyId": null
  },
  "meta": {}
}
```

---

## Catalogs

### `GET /api/courses`

**Auth:** authenticated  
**Response:** `{ "data": [ Course ], "meta": { "count": n } }`

### `GET /api/skills`

**Auth:** authenticated  
**Response:** `{ "data": [ Skill ], "meta": { "count": n } }`

### `GET /api/interests`

**Auth:** authenticated  
**Response:** `{ "data": [ Interest ], "meta": { "count": n } }`

---

## Students

### `GET /api/students`

**Auth:** teacher or admin  
**Response:** list envelope of `Student`

### `GET /api/students/:id`

**Auth:** owning student, teacher, or admin

### `POST /api/students`

**Auth:** authenticated student (own profile) or admin

```json
{
  "degreeProgramme": "Tietotekniikka",
  "department": "ICT",
  "studyCredits": 120,
  "availabilityStart": "2026-09-01",
  "availabilityEnd": "2026-12-15",
  "preferredProjectTypes": ["company_project", "internship"],
  "courseIds": ["..."],
  "skillIds": ["..."],
  "interestIds": ["..."]
}
```

**Response `201`:** `{ "data": Student, "meta": {} }`

### `PUT /api/students/:id`

**Auth:** owning student or admin  
Partial body allowed. Present ID arrays **replace** previous links.

---

## Projects

Canonical resource for company projects and internships. Field `projectType` is `company_project` or `internship`.

### `GET /api/projects`

**Auth:** authenticated  
**Query:** `projectType`, `status`, `q` (title/description search)

### `GET /api/projects/:id`

**Auth:** authenticated  
Returns `ProjectDetail` (project + weights + related catalog IDs).

### `POST /api/projects`

**Auth:** company (own) or admin

```json
{
  "title": "Campus portal renewal",
  "description": "Rebuild student-facing portal UI.",
  "projectType": "company_project",
  "positions": 2,
  "applicationStart": "2026-08-01",
  "applicationDeadline": "2026-09-15",
  "projectStart": "2026-10-01",
  "projectEnd": "2026-12-15",
  "workMode": "hybrid",
  "location": "Oulu",
  "remoteAllowed": true,
  "minimumStudyCredits": 60,
  "requiredLanguage": "fi",
  "department": "ICT",
  "requiredCourseIds": ["..."],
  "recommendedCourseIds": ["..."],
  "requiredSkillIds": ["..."],
  "interestIds": ["..."],
  "weights": {
    "studyCredits": 10,
    "requiredCourses": 20,
    "recommendedCourses": 10,
    "skills": 25,
    "language": 10,
    "availability": 10,
    "interests": 10,
    "degreeProgramme": 5
  }
}
```

**Response `201`:** `{ "data": ProjectDetail, "meta": {} }`  
Weights must sum to **100** or the request fails with `VALIDATION_ERROR`.

### `PUT /api/projects/:id`

**Auth:** owning company or admin

### `DELETE /api/projects/:id`

**Auth:** owning company or admin  
**Response `204`:** empty body (no JSON envelope)

---

## Applications

### `POST /api/applications`

**Auth:** student

```json
{
  "projectId": "pr000000-0000-4000-8000-000000000001",
  "message": "I am interested in this project."
}
```

**Response `201`:** `{ "data": Application, "meta": {} }`  
**Errors:** `409` if duplicate `(studentId, projectId)`

### `GET /api/applications/me`

**Auth:** student  
**Response:** list of `ApplicationWithProject`

### `GET /api/applications/:id`

**Auth:** owning student, owning company, teacher, or admin

### `GET /api/students/:id/applications`

**Auth:** owning student, teacher, or admin  
**Response:** list of `ApplicationWithProject` for that student.

### `GET /api/projects/:id/applicants`

**Auth:** project company owner, teacher, or admin  
Sorted by match `totalScore` desc when a match exists.

```json
{
  "data": [
    {
      "application": {
        "id": "...",
        "status": "submitted",
        "message": "...",
        "submittedAt": "2026-08-02T10:00:00.000Z"
      },
      "student": {
        "id": "...",
        "degreeProgramme": "Tietotekniikka",
        "department": "ICT",
        "studyCredits": 120
      },
      "profile": {
        "displayName": "Aino Virtanen",
        "email": "aino.virtanen@students.oamk.fi"
      },
      "match": {
        "totalScore": 85,
        "explanation": "...",
        "scoreBreakdown": {
          "studyCredits": 10,
          "requiredCourses": 20,
          "recommendedCourses": 8,
          "skills": 25,
          "language": 10,
          "availability": 7,
          "interests": 5,
          "degreeProgramme": 0
        }
      }
    }
  ],
  "meta": { "count": 1, "topN": 3 }
}
```

### `PATCH /api/applications/:id/status`

**Auth:** owning company or admin  
Sets a status other than `withdrawn` (student self-service uses the withdraw endpoint below).

```json
{ "status": "under_review" }
```

### `POST /api/applications/:id/withdraw`

**Auth:** owning student or admin  
Sets status to `withdrawn`. Withdrawn applications can never be shortlisted or selected afterward.

### `POST /api/applications/:id/shortlist`

**Auth:** owning company or admin  
Moves the application to `shortlisted` and notifies the student (`application_shortlisted`). Idempotent — calling again while already shortlisted returns the unchanged application.

**Response `201`:** `{ "data": Application, "meta": {} }`  
**Errors:** `409` if the application is `withdrawn` or already `selected`.

### `DELETE /api/applications/:id/shortlist`

**Auth:** owning company or admin  
Reverts a `shortlisted` application back to `under_review`.  
**Errors:** `409` if the application is not currently `shortlisted`.

### `GET /api/applications/:id/decision`

**Auth:** owning student, owning company, teacher, or admin  
Returns the `SelectionDecision` for this application, if any.  
**Errors:** `404` if no decision has been made yet.

---

## Matching

Score is an integer **0–100**. Same inputs → same score, breakdown, and explanation.  
Matching **does not** create a `SelectionDecision`.

### `POST /api/matches/run`

**Auth:** student (own profile). Teachers/admins may pass `{ "studentId": "<uuid>" }` in the body, or use `POST /api/matches/run/:studentId`. Companies should use `POST /api/projects/:id/matches`.

```json
{
  "projectIds": ["pr000000-0000-4000-8000-000000000001"],
  "locale": "fi"
}
```

**Response `200`:** `{ "data": [ Match ], "meta": { "count": n, "studentId": "..." } }`

### `POST /api/matches/run/:studentId`

**Auth:** that student (own), teacher, or admin.

Same body/response as `POST /api/matches/run`.

### `GET /api/matches/me`

**Auth:** student  
Own matches only (student-safe). May include `weightsSnapshot` for transparency.

**Query:** `limit` (default 10, max 50)

**Response `200`:** `{ "data": [ Match ], "meta": { "count": n, "studentId": "..." } }`

### `GET /api/matches/:studentId`

**Auth:** that student (own), teacher, or admin.  
Prefer `GET /api/matches/me` for the signed-in student.

### `GET /api/projects/:id/matches`

**Auth:** company owner, teacher, or admin  
Full match list for the project (not student-visible).

### `GET /api/projects/:id/top-candidates`

**Auth:** company owner, teacher, or admin only  
**Query:** `limit` (default **3**, max 10)

```json
{
  "data": [
    {
      "rank": 1,
      "match": { "totalScore": 92, "...": "..." },
      "student": {
        "id": "...",
        "degreeProgramme": "Tietotekniikka",
        "studyCredits": 160
      },
      "profile": {
        "displayName": "Aino Virtanen",
        "email": "aino.virtanen@students.oamk.fi"
      },
      "applicationId": "..."
    }
  ],
  "meta": {
    "count": 1,
    "projectId": "pr000000-0000-4000-8000-000000000001",
    "limit": 3
  }
}
```

Students calling this endpoint receive `403 FORBIDDEN`.

---

## Selection (company final choice)

### `POST /api/projects/:id/selections`

**Auth:** owning company or admin

```json
{
  "studentId": "s0000000-0000-4000-8000-000000000001",
  "applicationId": "a0000000-0000-4000-8000-000000000001",
  "decision": "selected",
  "reason": "Strong React fit and availability."
}
```

**Response `201`:** `{ "data": SelectionDecision, "meta": {} }` — includes a frozen snapshot of the match at decision time:

```json
{
  "matchId": "m0000000-0000-4000-8000-000000000001",
  "matchSnapshot": {
    "totalScore": 85,
    "scoreBreakdown": { "...": 0 },
    "explanation": "..."
  },
  "weightsSnapshot": { "...": 0 },
  "algorithmRank": 1
}
```

`matchSnapshot` / `weightsSnapshot` / `algorithmRank` are captured once, at decision time, and are **not** recomputed if the project's weights or matches change later (see `docs/MATCHING_ALGORITHM.md`).

Effects (MVP):

- Application referenced by `applicationId` → status `selected` or `not_selected`
- A project cannot have more `selected` decisions than `projects.positions` (enforced by a DB trigger; `409 CONFLICT` if full)
- Withdrawn applications cannot be selected (`409 CONFLICT`)
- Student receives a `student_selected` or `student_not_selected` notification; teachers receive `selection_completed_for_teacher` when a student is selected

### `GET /api/projects/:id/selections`

**Auth:** owning company, teacher, or admin

---

## Notifications

### `GET /api/notifications`

**Auth:** own inbox  
**Query:** `unread=true`, `limit` (default 50, max 100)

```json
{
  "data": [
    {
      "id": "...",
      "profileId": "...",
      "type": "application_received",
      "language": "fi",
      "title": "New application",
      "body": "Aino Virtanen applied to \"Campus portal renewal\".",
      "readAt": null,
      "createdAt": "2026-08-04T12:00:00.000Z"
    }
  ],
  "meta": { "count": 1, "unreadCount": 1 }
}
```

### `PATCH /api/notifications/:id/read`

Mark one as read. **Response:** `{ "data": Notification, "meta": {} }`  
(`PATCH /api/notifications/:id` is kept as a legacy alias for the same behavior.)

### `POST /api/notifications/mark-all-read`

**Response:** `{ "data": { "updated": 3 }, "meta": {} }`  
(`POST /api/notifications/read-all` is kept as a legacy alias for the same behavior.)

### Notification types

Canonical values (`types/domain.ts` `NotificationType`); `selection_decided` is retained only for older rows and is superseded by the `student_selected` / `student_not_selected` pair.

| Event | Recipient | `type` |
|-------|-----------|--------|
| New application | Company (project owner) | `new_application_for_company` (also `application_received`) |
| Application status change | Student | `application_status_changed` |
| Application shortlisted | Student | `application_shortlisted` |
| Student selected | Student | `student_selected` |
| Student not selected | Student | `student_not_selected` |
| Selection completed | Teachers | `selection_completed_for_teacher` |
| Project updated | Interested students (optional) | `project_updated` (also `project_published`) |
| Application deadline approaching | Student | `application_deadline_approaching` |
| Matching run finished | Student | `match_ready` |

Notifications are created idempotently (`idempotencyKey` — see `docs/SCHEMA.md`), so retried side effects never duplicate a notification. Email sending remains out of MVP (in-app only).

---

## Audit

### `GET /api/audit`

**Auth:** teacher or admin only  
**Query:** `limit` (default 100, max 200)

Read-only history of sensitive writes, captured automatically by database triggers (never client-writable). See `docs/SCHEMA.md` and `docs/SECURITY.md` for the full action vocabulary.

```json
{
  "data": [
    {
      "id": "...",
      "actorProfileId": "90000000-0000-4000-8000-000000000099",
      "action": "selection_selected",
      "entityType": "selection_decision",
      "entityId": "d0000000-0000-4000-8000-000000000001",
      "oldValues": null,
      "newValues": { "...": "..." },
      "createdAt": "2026-08-10T14:00:00.000Z"
    }
  ],
  "meta": { "count": 1 }
}
```

Students and companies receive `403 FORBIDDEN`.

---

## Example resources

### Profile

```json
{
  "id": "90000000-0000-4000-8000-000000000001",
  "role": "student",
  "displayName": "Aino Virtanen",
  "email": "aino.virtanen@students.oamk.fi",
  "preferredLanguage": "fi",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

### Student

```json
{
  "id": "s0000000-0000-4000-8000-000000000001",
  "profileId": "90000000-0000-4000-8000-000000000001",
  "degreeProgramme": "Tietotekniikka",
  "department": "ICT",
  "studyCredits": 120,
  "availabilityStart": "2026-09-01",
  "availabilityEnd": "2026-12-15",
  "preferredProjectTypes": ["company_project"],
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

### Project

```json
{
  "id": "pr000000-0000-4000-8000-000000000001",
  "companyId": "c0000000-0000-4000-8000-000000000001",
  "title": "Campus portal renewal",
  "description": "Rebuild student-facing portal UI.",
  "projectType": "company_project",
  "status": "published",
  "positions": 2,
  "applicationStart": "2026-08-01",
  "applicationDeadline": "2026-09-15",
  "projectStart": "2026-10-01",
  "projectEnd": "2026-12-15",
  "workMode": "hybrid",
  "location": "Oulu",
  "remoteAllowed": true,
  "minimumStudyCredits": 60,
  "requiredLanguage": "fi",
  "department": "ICT",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

### Application

```json
{
  "id": "a0000000-0000-4000-8000-000000000001",
  "projectId": "pr000000-0000-4000-8000-000000000001",
  "studentId": "s0000000-0000-4000-8000-000000000001",
  "status": "submitted",
  "message": "I am interested in this project.",
  "submittedAt": "2026-08-02T10:00:00.000Z",
  "updatedAt": "2026-08-02T10:00:00.000Z"
}
```

### SelectionDecision

```json
{
  "id": "d0000000-0000-4000-8000-000000000001",
  "projectId": "pr000000-0000-4000-8000-000000000001",
  "studentId": "s0000000-0000-4000-8000-000000000001",
  "applicationId": "a0000000-0000-4000-8000-000000000001",
  "decision": "selected",
  "decidedBy": "90000000-0000-4000-8000-000000000099",
  "reason": "Strong React fit and availability.",
  "decidedAt": "2026-08-10T14:00:00.000Z"
}
```

---

## Frontend integration notes

- Venla should call these paths from a thin service layer (`lib/shared/api-client.ts` will be updated in the route-migration phase).
- Map UI wording carefully:
  - UI “project” / “internship” → `projectType`: `company_project` / `internship`
  - Do **not** show Top 3 or peer ranks in student views
- Temporary adapters (if required) belong under `lib/integration/venla-*`, marked `VENLA-OWNED TEMPORARY INTEGRATION FILE`, listed in `docs/VENLA_TASKS.md`, and committed separately as `chore(venla): ...`.

See also: `types/domain.ts`, `types/api.ts`, `docs/SCHEMA.md`, `docs/SHARED_CONTRACT.md`, `docs/MATCHING_ALGORITHM.md`, `docs/SECURITY.md`.
