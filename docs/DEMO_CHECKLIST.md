# Demo checklist — MVP pull request

Manual end-to-end path for reviewing `tommi/backend-mvp`. Canonical data model is **projects** (not legacy opportunities). Password for every seed account: `LocalDemoOnly!1` (local Supabase Auth only — never use in a real deployment).

## Before demo

- [ ] `supabase db reset` (migrations + `supabase/seed.sql`)
- [ ] `.env.local` has URL, anon key, service role key (`cp .env.example .env.local`)
- [ ] `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` green
- [ ] `npm run dev` running
- [ ] Optional: `npm run smoke:flows` and `npm run smoke:company`

## Demo accounts (seed)

| Role | Email | Notes |
|------|-------|-------|
| Teacher | `teacher.demo@oamk.fi` | Oversight + audit (no project ownership) |
| Admin | `admin.demo@oamk.fi` | Full access |
| Company (Nordic Soft) | `contact@nordicsoft.example` | Owns Campus portal project |
| Company (Polar Byte) | `hr@polarbyte.example` | Isolation check vs Nordic Soft |
| Student (strong match) | `aino.virtanen@students.oamk.fi` | Primary demo student |
| Student | `mikko.korhonen@students.oamk.fi` | Secondary |

Campus portal project id (seed): `90000000-0000-4000-8000-000000000001`

## MVP demopolku

1. [ ] Opiskelija kirjautuu (`aino.virtanen@students.oamk.fi`) **tai** rekisteröityy uutena käyttäjänä
2. [ ] Opiskelijaprofiili voidaan täyttää / päivittää (`/profile/edit`)
3. [ ] Kursseja, taitoja ja kiinnostuksia voidaan lisätä
4. [ ] Yritys kirjautuu (`contact@nordicsoft.example`) ja luo projektin **tai** käyttää seed-projektia
5. [ ] Projektille lisätään vaatimukset (kurssit / skills / interests)
6. [ ] Painojen summa validoituu 100 prosenttiin (virheellinen summa hylätään)
7. [ ] Projekti julkaistaan (`published`)
8. [ ] Opiskelija hakee projektiin
9. [ ] Matching lasketaan (`POST /api/matches/run/:studentId` tai UI)
10. [ ] Opiskelija näkee **oman** tuloksensa ja selityksen — ei vertailurankia
11. [ ] Yritys näkee hakijat järjestettyinä (`/company/projects/:id/applicants`)
12. [ ] Yritys näkee Top 3 -ehdokkaat (`/company/projects/:id/top`)
13. [ ] Opiskelija **ei** näe Top 3 -listaa (`GET /api/projects/:id/top-candidates` → `403`)
14. [ ] Yritys shortlistaa hakijan
15. [ ] Yritys tekee valinnan (kapasiteetti ≤ `projects.positions`)
16. [ ] Valinta tallentuu audit-lokiin (`/teacher/audit` tai `GET /api/audit`)
17. [ ] Opiskelijalle syntyy ilmoitus (`/notifications`)
18. [ ] Opettaja näkee valinnan ja audit-tiedot (`teacher.demo@oamk.fi`)
19. [ ] Yritys A **ei** näe yrityksen B hakijoita (Nordic Soft vs Polar Byte)
20. [ ] `GET /api/health` → `database: connected`

## Automated coverage (not a full browser E2E)

| Check | Command / location |
|-------|--------------------|
| Privacy gates (Top 3, isolation, service role) | `lib/mvp/privacy.test.ts` |
| Happy-path contracts (weights, selection, notify) | `lib/mvp/e2e-rules.test.ts` |
| DB integrity + RLS smoke | `supabase/tests/integrity_check.sql` |
| Live API student/teacher/company flows | `npm run smoke:student` / `smoke:teacher` / `smoke:company` |

## Notes

- Matching is **deterministic and explainable**; the company always makes the final selection.
- Email delivery uses a **stub** in MVP — notifications are persisted in-app.
- Do not run `supabase/seed.sql` against a production Supabase project.
- Legacy `/api/opportunities` routes still exist in the tree but target a dropped table — use `/api/projects`.
