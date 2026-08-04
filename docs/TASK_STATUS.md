# Tehtävästatus (Tommi + Shared)

## Tommi (backend) — valmis repossa

| Issue | Artefakti |
|-------|-----------|
| Canonical models + API lock | `types/domain.ts`, `types/api.ts`, `docs/API.md` |
| Legacy runtime bridge | `types/legacy.ts` (opportunities API until migration) |
| #125–#142 / #151 | Skeema, API, matching, raportti, Postman (legacy surface) |
| #144 backend | `npm run smoke:student`, `lib/matching/flows.test.ts` |
| #145 backend | `npm run smoke:teacher` |
| #148 backend | `docs/BACKEND_REGRESSION.md`, `npm run smoke:flows` / `verify` |
| Deploy health | `GET /api/health?deep=1` DB-ping |
| Match FI/EN | `POST /api/matches/run/:id` body `{ "locale": "fi" }` |

## Seuraava (Tommi)

| Vaihe | Sisältö |
|-------|---------|
| Schema migration | `projects`, catalogs, applications statuses, selections, RLS |
| API route migration | `/api/projects`, envelope `{ data, meta }`, company role |
| Matching update | weights sum 100, Top 3 privacy |

## Shared — Tommin osuus valmis

| Issue | Artefakti | Venla vielä |
|-------|-----------|-------------|
| #100–#104 | sopimus + types (päivitetty) | VENLA-05 |
| #143 | `lib/shared/api-client.ts` (legacy paths) | UI-kytkentä + projects-migraatio |
| #147 | demo-fixtures + seed | UI-demo |
| #149 / #152 | raporttiluonnokset | `[VENLA]`-tekstit |
| #153 | `DEMO_CHECKLIST.md` | esitysharjoitus |

## Avoinna (ei Tommin UI-työtä)

- #143 frontend-kytkentä (Venla)
- #144–#145 selain-E2E yhdessä demossa
- #148 UI-lopputestaus
- #150 frontend-raportti (Venla)
