# Venlan integraatiotehtävät

Tähän tiedostoon kirjataan Tommin tekemät väliaikaiset frontend-yhteensopivuusmuutokset ja muut Venlan hoidettavat integraatiotehtävät.

---

## VENLA-00 — Yhdistä frontend kanoniseen API-sopimukseen

Tommi lisäsi / päivitti:

- `docs/API.md`, `docs/SHARED_CONTRACT.md`, `docs/MVP_SCOPE.md`
- `types/domain.ts`, `types/api.ts` (**SHARED**-otsikko tiedostoissa)
- `GET /api/me`
- `lib/shared/api-client.ts` (**SHARED**, issue #143)

Syy:
Sprintti 1:n UI käyttää vielä placeholdereita ja projektisanastoa.

Poistaminen / integraatio:
1. Luo frontend service-kerros, joka kutsuu `createSharedApiClient()` (älä fetchöi URL:eja komponenteissa).
2. Korvaa mock-data vaiheittain API-kutsuilla.
3. Mapaa UI-teksti "Projects" → API `opportunities`.
4. Käytä `client.me()` roolin ja `student_id`:n lukemiseen.

Tila: odottaa Venlan integraatiota.

---

## VENLA-01 — Huomioi middleware-autentikointi

Tommi päivitti:

- `middleware.ts`
- `lib/supabase/middleware.ts`

Syy:
Sivusuojaus käyttää Supabase `getUser()`-sessiota.

Vaikutus:
1. Kirjautuminen `@supabase/ssr` browser clientillä.
2. Mock-login ilman sessiota ei ohita suojauksia.
3. `/api/*` palauttaa JSON 401.

Tila: odottaa Venlan auth-UI-integraatiota.

---

## VENLA-02 — Raportin yhteiset osiot

Tommi luonnosteli SHARED-dokumentit:

- `docs/RAPORTTI_JOHDANTO.md` (#149) — täydennä [VENLA]-kohdat
- `docs/RAPORTTI_POHDINTA.md` (#152) — täydennä [VENLA]-kohdat
- `docs/RAPORTTI_BACKEND.md` — Tommin tekninen osuus (valmis)

Tila: odottaa Venlan täydennyksiä ennen lopullista yhdistämistä.
