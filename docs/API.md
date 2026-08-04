# API Contract — OAMK Matching Tool

<!--
SHARED — Tommi + Venla
Canonical contract locked before the projects-model schema migration.
-->

Shared REST contract for Tommi (backend) and Venla (frontend).  
Canonical TypeScript: `types/domain.ts`, `types/api.ts`.

**Runtime note:** Live handlers still expose the previous `/api/opportunities` surface via `types/legacy.ts`. This document is the **target** contract. Route migration follows schema migration.

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
| Create/update own projects | — | yes | —* | yes |
| Apply to project | yes | — | — | — |
| See own match result | yes | — | —* | yes |
| See Top 3 / ranked applicants | — | own projects | yes | yes |
| Final selection decision | — | own projects | — | yes |
| Run matching | own | own projects | yes | yes |

\* Teachers may create projects only if product rules later allow; MVP ownership of project rows is `companyId`. Teachers may inspect matches for oversight.

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

No auth.

**Response `200`**

```json
{
  "data": {
    "status": "ok",
    "service": "oamk-matching-tool",
    "timestamp": "2026-08-04T12:00:00.000Z",
    "supabase": "configured"
  },
  "meta": {}
}
```

`GET /api/health?deep=1` adds `database`: `ok` \| `error` \| `skipped`. On DB failure `status` becomes `degraded`.

---

## Current user

### `GET /api/me`

**Auth:** required

```json
{
  "data": {
    "profile": {
      "id": "p0000000-0000-4000-8000-000000000001",
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

### `PATCH /api/applications/:id`

**Auth:** company owner / admin (status transitions), or owning student (`withdrawn` only)

```json
{ "status": "under_review" }
```

---

## Matching

Score is an integer **0–100**. Same inputs → same score, breakdown, and explanation.  
Matching **does not** create a `SelectionDecision`.

### `POST /api/matches/run`

**Auth:** student (own), company (own projects), teacher, or admin

```json
{
  "projectIds": ["pr000000-0000-4000-8000-000000000001"],
  "locale": "fi"
}
```

**Response `200`:** `{ "data": [ Match ], "meta": { "count": n } }`

### `GET /api/matches/me`

**Auth:** student  
Own matches only (student-safe). May include weights for transparency.

```json
{
  "data": [
    {
      "match": {
        "id": "...",
        "projectId": "...",
        "studentId": "...",
        "totalScore": 85,
        "scoreBreakdown": { "...": 0 },
        "matchedCourses": ["Web-ohjelmointi"],
        "missingRequiredCourses": ["Tietokannat"],
        "matchedSkills": ["React", "TypeScript"],
        "missingRequiredSkills": ["Supabase"],
        "explanation": "Strong skill overlap; one required course missing.",
        "weightsSnapshot": {
          "studyCredits": 10,
          "requiredCourses": 20,
          "recommendedCourses": 10,
          "skills": 25,
          "language": 10,
          "availability": 10,
          "interests": 10,
          "degreeProgramme": 5
        },
        "calculatedAt": "2026-08-04T12:00:00.000Z"
      },
      "weights": { "...": 0 },
      "project": {
        "id": "...",
        "title": "Campus portal renewal",
        "projectType": "company_project"
      }
    }
  ],
  "meta": { "count": 1 }
}
```

### `GET /api/projects/:id/matches`

**Auth:** company owner, teacher, or admin  
Full match list for the project (not student-visible).

### `GET /api/projects/:id/matches/top`

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

**Response `201`:** `{ "data": SelectionDecision, "meta": {} }`

Effects (MVP):

- Selected application → `selected`
- Other active applications for the same project may move to `not_selected` when positions are filled (implementation detail in selection service)
- Student receives `selection_decided` notification

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

### `PATCH /api/notifications/:id`

Mark one as read. **Response:** `{ "data": Notification, "meta": {} }`

### `POST /api/notifications/read-all`

**Response:** `{ "data": { "updated": 3 }, "meta": {} }`

### Notification types

| Event | Recipient | `type` |
|-------|-----------|--------|
| New application | Company (project owner) | `application_received` |
| Application status change | Student | `application_status_changed` |
| Matching run finished | Student | `match_ready` |
| Selection decided | Student | `selection_decided` |
| Project published | Interested students (optional) | `project_published` |

Email sending remains out of MVP (in-app + stub only).

---

## Example resources

### Profile

```json
{
  "id": "p0000000-0000-4000-8000-000000000001",
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
  "profileId": "p0000000-0000-4000-8000-000000000001",
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
  "decidedBy": "p0000000-0000-4000-8000-000000000099",
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

See also: `types/domain.ts`, `types/api.ts`, `docs/SCHEMA.md` (pending migration), `docs/SHARED_CONTRACT.md`.
