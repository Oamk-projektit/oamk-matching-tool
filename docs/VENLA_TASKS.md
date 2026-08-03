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

Syy:
Sprintti 1:n UI käyttää vielä placeholdereita ja projektisanastoa. Backend käyttää `Opportunity`-mallia (`type: project | internship`) ja `/api/*`-reittejä.

Poistaminen / integraatio:
1. Luo service-kerros (`studentService`, `opportunityService`, `applicationService`, `matchService`) käyttäen `types/api.ts`-tyyppejä.
2. Korvaa mock-data vaiheittain API-kutsuilla (`docs/API.md`).
3. Mapaa UI-teksti "Projects" → API `opportunities` (älä uudelleennimeä backend-kenttiä).

Tila: odottaa Venlan integraatiota, ei väliaikaisia Tommi-adaptereita.
