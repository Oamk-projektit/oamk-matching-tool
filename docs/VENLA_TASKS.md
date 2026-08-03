# Venlan integraatiotehtävät

Tähän tiedostoon kirjataan Tommin tekemät väliaikaiset frontend-yhteensopivuusmuutokset ja muut Venlan hoidettavat integraatiotehtävät.

Tällä hetkellä **ei ole väliaikaisia adaptereita**. Backend-sopimus on dokumentoitu; Venla voi integroida sen kun mock-data korvataan.

---

## VENLA-00 — Yhdistä frontend kanoniseen API-sopimukseen

Tommi lisäsi / päivitti:

- `docs/API.md`
- `docs/SCHEMA.md`
- `types/domain.ts`
- `types/api.ts`
- `GET /api/me`

Syy:
Sprintti 1:n UI käyttää vielä placeholdereita ja projektisanastoa. Backend käyttää `Opportunity`-mallia (`type: project | internship`) ja `/api/*`-reittejä.

Poistaminen / integraatio:
1. Luo service-kerros (`studentService`, `opportunityService`, `applicationService`, `matchService`) käyttäen `types/api.ts`-tyyppejä.
2. Korvaa mock-data vaiheittain API-kutsuilla (`docs/API.md`).
3. Mapaa UI-teksti "Projects" → API `opportunities` (älä uudelleennimeä backend-kenttiä).
4. Käytä `GET /api/me` roolin ja `student_id`:n lukemiseen login-jälkeen.

Tila: odottaa Venlan integraatiota, ei väliaikaisia Tommi-adaptereita.

---

## VENLA-01 — Huomioi middleware-autentikointi

Tommi päivitti:

- `middleware.ts`
- `lib/supabase/middleware.ts`

Syy:
Sivusuojaus käyttää nyt oikeaa Supabase `getUser()`-sessiota (ei enää `sb-auth-token`-cookien nimen arvailua). Julkiset sivut ovat eksakteja polkuja (`/`, `/login`, …).

Vaikutus frontendiin:
1. Kirjautumisen pitää asettaa Supabase Auth -evästeet (`@supabase/ssr` browser client).
2. Vanha mock-login ilman Supabase-sessiota ei enää ohita suojattuja sivuja.
3. `/api/*` ei redirectaa HTML-loginille; API palauttaa JSON 401.

Tila: odottaa Venlan auth-UI-integraatiota Supabaseen.
