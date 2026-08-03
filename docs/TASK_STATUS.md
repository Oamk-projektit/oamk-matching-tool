# Tehtävästatus (Tommi + Shared)

Päivitetty backend-haaran mukaan. GitHub-issuet voivat olla vielä OPEN vaikka työ olisi repossa valmis.

## Tommi (backend)

| Issue | Tehtävä | Repo-status |
|-------|---------|-------------|
| #125 | Supabase + env | Valmis (docs + clients) |
| #126 | Taulut | Valmis (`supabase/migrations`) |
| #127 | Seed | Valmis (`supabase/seed.sql`) |
| #128 | RLS | Valmis |
| #129 | Backend-rakenne | Valmis (Next.js `app/api` + `lib/*`) |
| #130–#133 | Student/Opp/App APIs | Valmis |
| #134–#137 | Matching | Valmis |
| #138 | Ilmoitukset / email | In-app + **email-stub** (ei SMTP) |
| #139 | Validointi | Valmis |
| #140 | Postman | Valmis (`docs/postman_collection.json`) |
| #141 | Deploy | Ohjeet valmiit (`docs/BACKEND.md`) |
| #142 / #151 | Raportti backend | Valmis (`docs/RAPORTTI_BACKEND.md`) |

## Shared (Tommi teki luonnoksen, Venla täydentää)

| Issue | Tehtävä | Merkintä koodissa/docsissa |
|-------|---------|----------------------------|
| #100 | MVP-rajaus | `docs/MVP_SCOPE.md` — **SHARED** |
| #101–#104 | Sopimus | `types/*`, `docs/SHARED_CONTRACT.md`, `docs/API.md` — **SHARED** |
| #143 | API-client integraatioon | `lib/shared/api-client.ts` — **SHARED** |
| #149 | Johdanto | `docs/RAPORTTI_JOHDANTO.md` — **SHARED** (+ `[VENLA]`-aukot) |
| #152 | Pohdinta | `docs/RAPORTTI_POHDINTA.md` — **SHARED** (`[TOMMI]` / `[VENLA]`) |
| #146 | Email-simulaatio | `lib/notifications/email-stub.ts` — **TOMMI** (testattavissa) |

## Ei vielä / Venla

- Frontend mock → API (#143 UI-osa)
- Frontend-raportti (#150)
- E2E-käyttöpolkutestit (#144–#145) yhdessä demossa
