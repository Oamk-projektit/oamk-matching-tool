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

## Seuraava (Shared / demo)

| Vaihe | Sisältö |
|-------|---------|
| #120 / #121 | Selain-E2E opiskelija + yritys/opettaja (API-smoket OK) |
| #149 / #150 / #152 | Raportin johdanto, frontend-osuus, pohdinta |
| #153 | Lopullinen esitys / demo (`docs/DEMO_CHECKLIST.md`) |

## Shared — Tommin osuus valmis

| Issue | Artefakti | Venla / yhteinen vielä |
|-------|-----------|------------------------|
| #100–#104 | sopimus + types | raporttitekstit tarvittaessa |
| #143 | `lib/api/client.ts` live | UI jo kytketty; selain-E2E |
| #147 | seed + demo-fixtures | esitysharjoitus |
| #149 / #152 | raporttiluonnokset | `[VENLA]`-tekstit |
| #153 | `DEMO_CHECKLIST.md` | esitysharjoitus |

## Avoinna (ei Tommin UI-työtä)

- #120–#121 selain-E2E yhdessä demossa
- #150 frontend-raportti (Venla)
- #149 / #152 / #153 raportti + esitys (Shared)
