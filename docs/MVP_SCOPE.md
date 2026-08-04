# MVP-rajaus

<!--
SHARED — Tommi + Venla
Issues: #100
-->

## Pakollinen MVP

| Osa | Omistaja | Tila (backend) |
|-----|----------|----------------|
| Kanoniset domain-tyypit + API-sopimus | Tommi / SHARED | Lukittu (`types/domain.ts`, `docs/API.md`) |
| Skeema-migraatio `projects` + RLS | Tommi | Seuraava vaihe |
| Opiskelijaprofiili (CRUD API) | Tommi / Venla UI | Live legacy API; kanoninen sopimus lukittu |
| Projektit + harjoittelut (`projects.projectType`) | Tommi / Venla UI | Live: `/api/opportunities`; target: `/api/projects` |
| Hakemukset (`applications`) | Tommi / Venla UI | Live legacy statukset; target: uudet statukset |
| Matching 0–100 + selitykset | Tommi | Live; painot targetissa summa 100 |
| Top 3 vain company/teacher/admin | Tommi | Sopimus lukittu; RLS/API seuraavaksi |
| Yrityksen lopullinen valinta | Tommi | Sopimus lukittu (`SelectionDecision`) |
| Ilmoitukset (in-app) | Tommi | Live; target-kentät lukittu |
| Demo + seed | Shared | Seed legacy; päivitetään migraation kanssa |
| Raportti | Shared | Backend-osuus `docs/RAPORTTI_BACKEND.md` |

## Vapaaehtoinen / ei MVP

- Opinnäytetyöt (`thesis` / erillinen tyyppi)
- Maksut
- Chat
- Mobiilisovellus
- Ulkoinen AI-API matchingiin
- Automaattinen lopullinen valinta ilman ihmistä
- Oikea SMTP-sähköposti (MVP:ssä in-app + email-stub)

## Sopimus

Yhteinen sopimus: `docs/SHARED_CONTRACT.md`, `types/domain.ts`, `types/api.ts`, `docs/API.md`.  
Väliaikainen runtime: `types/legacy.ts` + `/api/opportunities`.
