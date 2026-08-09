# Demo checklist — MVP

Manual end-to-end path for the final demo (#153). Canonical data model is **projects** (not legacy opportunities). Password for every seed account: `LocalDemoOnly!1` (local Supabase Auth only — never use in a real deployment).

## Before demo

- [ ] `supabase db reset` (migrations + `supabase/seed.sql`)
- [ ] `.env.local` has URL, anon key, service role key (`cp .env.example .env.local`)
- [ ] `npm run lint` / `npm run typecheck` / `npm test` / `npm run build` green
- [ ] `npm run dev` running
- [ ] Optional but recommended: `npm run smoke:flows` and `npm run smoke:security`
- [ ] Postman import refreshed: `docs/postman_collection.json` (projects model)

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
9. [ ] Matching lasketaan (`POST /api/matches/run` tai UI `/matches`)
10. [ ] Opiskelija näkee **oman** tuloksensa (`GET /api/matches/me`) ja selityksen — ei vertailurankia
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

| Checklist steps | Command |
|-----------------|---------|
| Student login → match → apply → notifications (≈ 1–10, 17) | `npm run smoke:student` |
| Company applicants / Top 3 / selection (≈ 11–15) | `npm run smoke:company` |
| Teacher oversight / audit (≈ 16, 18) | `npm run smoke:teacher` |
| All role journeys | `npm run smoke:flows` |
| Top 3 forbidden, isolation, role escalation | `npm run smoke:security` |
| Privacy gates (unit) | `lib/mvp/privacy.test.ts` |
| Happy-path contracts (unit) | `lib/mvp/e2e-rules.test.ts` |
| DB integrity + RLS smoke | `supabase/tests/integrity_check.sql` |

Run these **before** the live browser walkthrough so UI-only surprises are isolated.

## Presentation talking points (#153)

Keep the spoken demo to ~5–8 minutes. Suggested order:

1. **Problem (30 s)** — Students and company projects are hard to match manually; need explainable scores, not a black box.
2. **Architecture (45 s)** — One Next.js app + Supabase; shared `types/domain.ts` / `docs/API.md`; company owns projects, teacher oversees.
3. **Student path (90 s)** — Profile → browse → `matches/run` → own score + FI explanation → apply. Emphasize: no peer ranking.
4. **Company path (90 s)** — Applicants sorted by score → Top 3 → shortlist → final selection within capacity. Matching never auto-picks.
5. **Privacy / security (45 s)** — Student Top 3 → 403; company isolation; RLS + service role only on server; audit trail for teachers.
6. **Limits & next (30 s)** — In-app notifications (no SMTP yet); rule-based matching (not ML); browser E2E still manual.

Backup if UI flakes: show Postman or terminal smoke output for the same steps (`docs/API_TESTING.md`).

## Dry-run status (#153)

| Valmistelu | Tila |
|------------|------|
| Checklist + talking points | Valmis |
| Seed-tilit + Postman + API smokes | Valmis |
| Manuaalinen selainkävely (#120 / #121) | Auki — aja ennen live-esitystä |
| Raportti (johdanto / backend / frontend / pohdinta) | Valmis (`docs/RAPORTTI.md`) |

Owner for live dry-run: Tommi (Venla not on the project).

## Notes

- Matching is **deterministic and explainable**; the company always makes the final selection.
- Email delivery uses a **stub** in MVP — notifications are persisted in-app.
- Do not run `supabase/seed.sql` against a production Supabase project.
- Legacy `/api/opportunities` routes return **410 Gone** — use `/api/projects`.
- Full report TOC: `docs/RAPORTTI.md`.
