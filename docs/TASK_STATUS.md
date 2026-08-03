# Tehtävästatus (Tommi + Shared)

## Tommi (backend) — valmis repossa

| Issue | Artefakti |
|-------|-----------|
| #125–#142 / #151 | Skeema, API, matching, raportti, Postman |
| #144 backend | `npm run smoke:student`, `lib/matching/flows.test.ts` |
| #145 backend | `npm run smoke:teacher` |
| #148 backend | `docs/BACKEND_REGRESSION.md`, `npm run smoke:flows` / `verify` |
| Deploy health | `GET /api/health?deep=1` DB-ping |
| Match FI/EN | `POST /api/matches/run/:id` body `{ "locale": "fi" }` |

## Shared — Tommin osuus valmis

| Issue | Artefakti | Venla vielä |
|-------|-----------|-------------|
| #100–#104 | sopimus + types | — |
| #143 | `lib/shared/api-client.ts` | UI-kytkentä |
| #147 | demo-fixtures + seed | UI-demo |
| #149 / #152 | raporttiluonnokset | `[VENLA]`-tekstit |
| #153 | `DEMO_CHECKLIST.md` | esitysharjoitus |

## Avoinna (ei Tommin UI-työtä)

- #143 frontend-kytkentä (Venla)
- #144–#145 selain-E2E yhdessä demossa
- #148 UI-lopputestaus
- #150 frontend-raportti (Venla)
