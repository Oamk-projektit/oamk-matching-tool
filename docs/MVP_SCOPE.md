# MVP-rajaus

<!--
SHARED — Tommi + Venla
Issues: #100
-->

**Tila: MVP valmis.** Backend ja frontend toimivat molemmat `projects`-mallilla.

## Pakollinen MVP

| Osa | Omistaja | Tila |
|-----|----------|------|
| Kanoniset domain-tyypit + API-sopimus | Tommi / SHARED | ✅ Valmis (`types/domain.ts`, `docs/API.md`) |
| Skeema-migraatio `projects` + RLS | Tommi | ✅ Valmis (`supabase/migrations/20260804*`) |
| Opiskelijaprofiili (CRUD API) | Tommi / Venla UI | ✅ Valmis: `/api/students`, UI `app/profile/*` |
| Projektit + harjoittelut (`projects.projectType`) | Tommi / Venla UI | ✅ Valmis: `/api/projects` on kanoninen ja live; legacy `/api/opportunities` → **410 Gone** |
| Hakemukset (`applications`) | Tommi / Venla UI | ✅ Valmis: haku, shortlist, withdraw, status, decision — `docs/API.md` § Applications |
| Matching 0–100 + selitykset | Tommi | ✅ Valmis: 8 kriteeriä, painot summa 100, deterministinen (`docs/MATCHING_ALGORITHM.md`) |
| Top 3 vain company/teacher/admin | Tommi | ✅ Valmis: `GET /api/projects/:id/top-candidates`, RLS + route-guard |
| Yrityksen lopullinen valinta | Tommi | ✅ Valmis: `SelectionDecision` + match/weights-snapshot + kapasiteettiraja |
| Ilmoitukset (in-app) | Tommi | ✅ Valmis: idempotentit, laajennetut tyypit |
| Audit-loki | Tommi | ✅ Valmis: DB-triggerit + `GET /api/audit` (teacher/admin) |
| Demo + seed | Shared | ✅ Valmis: `supabase/seed.sql` (5 opiskelijaa, 2 yritystä, 7 projektia) |
| Raportti | Shared | Backend-osuus `docs/RAPORTTI_BACKEND.md`; ks. myös `docs/PROJECT_WORK.md` |

## Vapaaehtoinen / ei MVP

- Opinnäytetyöt (`thesis` / erillinen tyyppi) — ei toteutettu
- Maksut — ei toteutettu
- Chat — ei toteutettu
- Mobiilisovellus — ei toteutettu
- Ulkoinen AI-API matchingiin — ei toteutettu (deterministinen sääntömoottori)
- Automaattinen lopullinen valinta ilman ihmistä — ei toteutettu (yritys päättää aina)
- Oikea SMTP-sähköposti — ei toteutettu (MVP:ssä vain in-app-ilmoitukset)

## Sopimus

Yhteinen sopimus: `docs/SHARED_CONTRACT.md`, `types/domain.ts`, `types/api.ts`, `docs/API.md`.  
Legacy, ei enää käytössä nykyisellä skeemalla: `types/legacy.ts` + `/api/opportunities`.
