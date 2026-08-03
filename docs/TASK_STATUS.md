# Tehtävästatus (Tommi + Shared)

Päivitetty backend-haaran mukaan.

## Tommi (backend) — valmis repossa

| Issue | Tehtävä | Artefakti |
|-------|---------|-------------|
| #125–#129 | Setup, skeema, RLS, rakenne | `supabase/`, `lib/supabase/`, `app/api/` |
| #130–#133 | Student / Opp / Application APIs | `app/api/students|opportunities|applications` |
| #134–#137 | Matching | `lib/matching/`, `app/api/matches/` |
| #138 | Ilmoitukset + email-stub | `lib/notifications/` |
| #139 | Validointi | `lib/validation/`, `lib/api/` |
| #140 | Postman + smoke | `docs/postman_collection.json`, `npm run smoke` |
| #141 | Deploy-ohje | `docs/BACKEND.md` |
| #142 / #151 | Raportti | `docs/RAPORTTI_BACKEND.md` |

## Shared — Tommin luonnos valmis, Venla täydentää UI:n

| Issue | Artefakti |
|-------|-----------|
| #100 | `docs/MVP_SCOPE.md` |
| #101–#104 | `types/*`, `docs/SHARED_CONTRACT.md`, `docs/API.md` |
| #143 | `lib/shared/api-client.ts` (UI-kytkentä Venlalla) |
| #147 | `lib/shared/demo-fixtures.ts`, `docs/DEMO_CHECKLIST.md` |
| #149 | `docs/RAPORTTI_JOHDANTO.md` |
| #152 | `docs/RAPORTTI_POHDINTA.md` |
| #146 | `lib/notifications/email-stub.ts` |
| #153 | `docs/DEMO_CHECKLIST.md` (esitysjuoni) |

## Vielä Venlan / yhteisen demon varassa

- Frontend mock → `createSharedApiClient()` (#143 UI)
- Frontend-raportti (#150)
- Live E2E-käyttöpolut (#144–#145) demossa yhdessä
