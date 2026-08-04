# Venlan tehtävät (frontend)

Tommi lukitsi backend-sopimuksen (`types/domain.ts`, `types/api.ts`, `docs/API.md`, `docs/SCHEMA.md`).  
Tähän listataan **vain** Venlan myöhemmät UI-tehtävät. Älä toteuta näitä backend-haarassa.

---

## Frontend-tehtävät

| ID | Tehtävä | Huomio |
|----|---------|--------|
| VENLA-UI-01 | Opiskelijaprofiilin lomake | degreeProgramme, department, studyCredits, availability, preferredProjectTypes, kurssit/taidot/kiinnostukset |
| VENLA-UI-02 | Projektin luonti- ja muokkauslomake | `projectType`: `company_project` \| `internship`; ei opinnäytetyötä MVP:ssä |
| VENLA-UI-03 | Kurssihaku | Backend valmis: `GET /api/courses?search=` (koodi, name_fi, name_en, department). Tee vain UI-komponentti. |
| VENLA-UI-04 | Painotusten säätönäkymä | `ProjectWeights` summa = 100; näytä kriteerit opiskelijalle vain luettavana tarvittaessa |
| VENLA-UI-05 | Matching-tuloksen kortti | Opiskelija: vain oma tulos + selitys; ei muiden sijoituksia |
| VENLA-UI-06 | Top 3 -näkymä yritykselle ja opettajalle | Ei opiskelijalle; company / teacher / admin |
| VENLA-UI-07 | Valintapäätöksen käyttöliittymä | Yritys tekee `SelectionDecision`; matching ei autovalitse |
| VENLA-UI-08 | Ilmoituskeskus | In-app lista + merkitse luetuksi |
| VENLA-UI-09 | FI/EN-kielenvaihto | `preferredLanguage` / UI locale |

---

## Sopimusviitteet Venlalle

- Domain: `types/domain.ts`
- API: `docs/API.md` — vastaus `{ data, meta }`, virhe `{ error: { code, message, details } }`
- Skeema (target): `docs/SCHEMA.md`
- Projects-model CRUD (students/courses/projects/applications): live `/api/*`
- Legacy opportunities surface still present for older demos: `types/legacy.ts`, `/api/opportunities`

### Yksityisyys (UI:ssa pakollista)

1. Top 3 / ranking vain company-, teacher- ja admin-näkymissä.
2. Opiskelija näkee vain oman matchin; painot/kriteerit saa näyttää.
3. Älä näytä muiden hakijoiden pisteitä tai henkilöllisyyttä opiskelijalle.

### Väliaikaiset adapterit

Jos backend vaatii välttämättömän frontend-yhteensopivuusmuutoksen:

1. Yritä ensin backend-adapteria
2. Eristä `lib/integration/venla-*`
3. Tiedoston alkuun: `VENLA-OWNED TEMPORARY INTEGRATION FILE`
4. Kirjaa tähän tiedostoon
5. Commit: `chore(venla): ...`
6. Revertoitavissa ilman backendin rikkoontumista

---

## Aiemmat integraatiomuistiinpanot

### Middleware-auth

Sivusuojaus käyttää Supabase-sessiota. Mock-login ilman sessiota ei ohita suojauksia; `/api/*` → JSON 401.

### Demo / raportti

- Demo-fixturet: `lib/shared/demo-fixtures.ts` (legacy UUID:t kunnes seed päivittyy)
- Raportti: täydennä `[VENLA]`-kohdat `docs/RAPORTTI_JOHDANTO.md` / `docs/RAPORTTI_POHDINTA.md`
