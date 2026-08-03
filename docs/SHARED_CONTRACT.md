# Yhteinen API- ja tietomallisopimus

<!--
SHARED — Tommi + Venla
Issues: #101, #102, #103, #104, #143
-->

Tämä dokumentti kokoaa Epic 0 -sopimuksen. Kanoninen totuus on koodissa ja API-dokumentissa:

| Aihe | Lähde |
|------|--------|
| Opiskelija (#101) | `types/domain.ts` → `Student` |
| Opportunity (#102) | `types/domain.ts` → `Opportunity` |
| Matching-tulos (#103) | `types/domain.ts` → `MatchResult` |
| API-polut (#104) | `docs/API.md` + `lib/shared/api-client.ts` |
| Skeema | `docs/SCHEMA.md` |

## Esimerkkiopiskelija (JSON)

```json
{
  "id": "b0000000-0000-4000-8000-000000000011",
  "user_id": "a0000000-0000-4000-8000-000000000011",
  "name": "Aino Virtanen",
  "email": "aino.virtanen@students.oamk.fi",
  "degree_program": "Tietotekniikka",
  "credits": 160,
  "language": "FI",
  "availability": "Full-time",
  "completed_courses": ["Web-ohjelmointi", "Tietokannat"],
  "skills": ["React", "TypeScript", "SQL"],
  "interests": ["Web development", "UX"],
  "project_preferences": ["project"],
  "created_at": "2026-08-01T10:00:00.000Z",
  "updated_at": "2026-08-01T10:00:00.000Z"
}
```

## Esimerkki opportunity (project)

```json
{
  "id": "c0000000-0000-4000-8000-000000000001",
  "teacher_id": "a0000000-0000-4000-8000-000000000001",
  "name": "Campus portal renewal",
  "description": "Rebuild the student-facing campus portal UI.",
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

## Esimerkki match (~80+)

```json
{
  "score": 88,
  "matched_courses": ["Web-ohjelmointi"],
  "missing_courses": [],
  "matched_skills": ["React", "TypeScript"],
  "missing_skills": [],
  "explanation": "Strong overall fit for this opportunity. Matched skills: React, TypeScript.",
  "recommendation": "Ready to apply; review the opportunity description and schedule."
}
```

## Frontend-integraatio

Venla käyttää `lib/shared/api-client.ts` -kerrosta mockien korvaamiseen (#143).  
Älä rakenna rinnakkaisia kenttänimiä UI:hin — mapaa vain näyttötekstit.
