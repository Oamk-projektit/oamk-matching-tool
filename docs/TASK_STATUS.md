# Tehtävästatus (Tommi + Shared)

## Tommi (backend) — valmis repossa

| Issue | Artefakti |
|-------|-----------|
| Canonical models + API lock | `types/domain.ts`, `types/api.ts`, `docs/API.md` |
| Projects-model schema + RLS | `supabase/migrations/20260804*`, role lock `20260809141000*` |
| Live API | `/api/projects`, `/api/applications`, `/api/matches/me`, `/api/matches/run`, … |
| Legacy opportunities | **410 Gone** (`app/api/opportunities/*`); helpers in `types/legacy.ts` only |
| Frontend API client | `lib/api/client.ts` (+ `lib/shared/api-client.ts` alias) |
| #125–#142 / #151 | Skeema, API, matching, raportti, Postman |
| #144 backend | `npm run smoke:student`, `lib/matching/flows.test.ts` |
| #145 backend | `npm run smoke:teacher` / `smoke:company` |
| #148 backend | `docs/BACKEND_REGRESSION.md`, `npm run smoke:flows` / `smoke:security` / `verify` |
| Deploy health | `GET /api/health?deep=1` DB-ping |
| Match FI/EN | `POST /api/matches/run` body `{ "locale": "fi" }` |

## Raportti — valmis (Venla-luovutus)

| Issue | Artefakti |
|-------|-----------|
| #149 | `docs/RAPORTTI_JOHDANTO.md` — UI-näkökulma täytetty Tommin toimesta |
| #150 / #124 | `docs/RAPORTTI_FRONTEND.md` — frontend-raportti (Venla → Tommi) |
| #152 | `docs/RAPORTTI_POHDINTA.md` — entiset `[VENLA]`-kohdat täytetty |
| #151 | `docs/RAPORTTI_BACKEND.md` |

## Seuraava (Shared / demo)

| Vaihe | Sisältö |
|-------|---------|
| #120 / #121 | Selain-E2E opiskelija + yritys/opettaja (API-smoket OK; Postman päivitetty) |
| #153 | Esitysharjoitus / live dry-run checklistin talking points -osion mukaan |

## Shared — Tommin osuus valmis

| Issue | Artefakti | Vielä auki |
|-------|-----------|------------|
| #100–#104 | sopimus + types | — |
| #143 | `lib/api/client.ts` live | selain-E2E (#120/#121) |
| #147 | seed + demo-fixtures | esitysharjoitus (#153) |
| #149 / #152 | johdanto + pohdinta | — (valmis) |
| #150 / #124 | frontend-raportti | — (valmis) |
| #151 | `RAPORTTI_BACKEND.md` | — |
| #153 | `DEMO_CHECKLIST.md` + Postman + `API_TESTING.md` | live dry-run |

## Avoinna

- #120–#121 manuaalinen selain-E2E yhdessä demossa
- #153 live-esityksen dry-run (materiaali valmis)
