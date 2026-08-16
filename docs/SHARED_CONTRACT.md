# Yhteinen API- ja tietomallisopimus

<!--
SHARED — Tommi + Venla
Canonical contract locked before projects-model schema migration.
-->

Tämä dokumentti kokoaa yhteisen sopimuksen. Kanoninen totuus:

| Aihe | Lähde |
|------|--------|
| Domain-mallit | `types/domain.ts` |
| API-tyypit | `types/api.ts` |
| REST-sopimus | `docs/API.md` |
| Skeema (nykyinen runtime) | `docs/SCHEMA.md` |
| Frontend API-client | `lib/api/client.ts` (`lib/shared/api-client.ts` on yhteensopivuus-alias) |
| Legacy helpers | `types/legacy.ts` (ei live HTTP; `/api/opportunities` → 410) |

## Kanoniset päätökset

- Päätaulu: **`projects`** (`projectType`: `company_project` \| `internship`)
- Opinnäytetyöt eivät ole ensimmäisessä MVP:ssä
- **`applications`** on pakollinen
- Roolilähde: **`profiles.role`** (`student` \| `company` \| `teacher` \| `admin`)
- Yritys tekee lopullisen valinnan (`SelectionDecision`); matching ei autovalitse
- Top 3 vain company / teacher / admin
- Opiskelija näkee vain oman matching-tuloksen (+ painot)
- Painojen summa = **100**
- JSON-kentät: **camelCase**; yhtenäinen vastaus `{ data, meta }`

## Esimerkkiopiskelija

```json
{
  "id": "s0000000-0000-4000-8000-000000000001",
  "profileId": "p0000000-0000-4000-8000-000000000001",
  "degreeProgramme": "Tietotekniikka",
  "department": "Informaatioteknologia",
  "studyCredits": 160,
  "availabilityStart": "2026-09-01",
  "availabilityEnd": "2026-12-15",
  "preferredProjectTypes": ["company_project"],
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

## Esimerkki project (company_project)

```json
{
  "id": "pr000000-0000-4000-8000-000000000001",
  "companyId": "c0000000-0000-4000-8000-000000000001",
  "title": "Campus portal renewal",
  "description": "Rebuild the student-facing campus portal UI.",
  "projectType": "company_project",
  "status": "published",
  "positions": 2,
  "workMode": "hybrid",
  "location": "Oulu",
  "remoteAllowed": true,
  "minimumStudyCredits": 60,
  "requiredLanguage": "fi",
  "department": "Informaatioteknologia"
}
```

## Esimerkki match (~80+)

```json
{
  "totalScore": 88,
  "matchedCourses": ["Web-ohjelmointi"],
  "missingRequiredCourses": [],
  "matchedSkills": ["React", "TypeScript"],
  "missingRequiredSkills": [],
  "explanation": "Strong overall fit for this project. Matched skills: React, TypeScript."
}
```

## Frontend-integraatio

Venla käyttää `lib/api/client.ts` (`createApiClient` / `api`).  
`lib/shared/api-client.ts` re-exporttaa saman clientin vanhemmilla nimillä (`createSharedApiClient`).  
Älä rakenna rinnakkaisia kenttänimiä — mapaa vain näyttötekstit.

Live-API käyttää `projects`-polkuja (`types/domain.ts`). Legacy `/api/opportunities` palauttaa **410 Gone**.
Opiskelijan match-lukeminen: `GET /api/matches/me` (ei vertailurankia).
