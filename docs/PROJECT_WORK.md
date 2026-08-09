# Projektityön yhteenveto — OAMK Matching Tool

<!-- SHARED — Tommi (backend + luovutus) + Venla (frontend-pohja) -->

Tiivistelmä projektityöstä raportointia ja demoa varten. **Raporttitoimitus OAMK-projektiin:** aloita `docs/RAPORTTI.md`. MVP on **valmis**: backend ja frontend toimivat samalla `projects`-mallilla (`types/domain.ts`). Venla poistui projektista; Tommi viimeisteli integraation ja raportin UI-osuudet.

---

## 1. Mitä rakennettiin

OAMK Matching Tool on Next.js + Supabase -sovellus, joka yhdistää opiskelijat yritysten projekteihin ja harjoitteluihin (`projectType`: `company_project` | `internship`). Ydintoiminnallisuus:

- Opiskelijaprofiili: opinnot, suoritetut kurssit, taidot, kiinnostuksen kohteet, saatavuus
- Yritysten projektien luonti ja hallinta, painotettu ottelutuskriteeristö (`project_weights`)
- Deterministinen 0–100 pisteytys selityksineen (`lib/matching/calculate-match.ts`)
- Hakemusprosessi: `submitted → under_review → shortlisted → selected/not_selected` (tai `withdrawn`)
- Yrityksen lopullinen valintapäätös — matching ei koskaan valitse automaattisesti
- Sisäiset ilmoitukset (in-app notifications)
- Audit-loki tietokannan trigger-toteutuksena

## 2. Työnjako (Division of work)

| Alue | Vastuu | Sisältö |
|------|--------|---------|
| **Backend** (Tommi) | Supabase-skeema ja migraatiot, RLS-politiikat, `/api/*`-reitit (Next.js Route Handlers), matching-moottori, ilmoitukset, audit-triggerit, yksikkötestit | `supabase/migrations/`, `lib/`, `app/api/`, `types/domain.ts` |
| **Frontend** (Venla → Tommi) | Next.js App Router -sivut, komponentit, tyylijärjestelmä; live-API + raportti Tommin viimeistelemänä | `app/*/page.tsx`, `components/`, `docs/DESIGN_SYSTEM.md`, `docs/RAPORTTI_FRONTEND.md` |
| **Shared** | API-sopimus (`docs/API.md`, `types/domain.ts`), MVP-rajaus, demo-juoni | `docs/SHARED_CONTRACT.md`, `docs/MVP_SCOPE.md` |

## 3. Arkkitehtuuri (Architecture)

```
Next.js (App Router)
 ├─ app/*/page.tsx          UI per role: student, company, teacher, admin
 ├─ app/api/*/route.ts      REST API (Route Handlers) — JSON in/out, no HTML
 ├─ lib/
 │   ├─ supabase/           client.ts (browser), server.ts (cookies), admin.ts (service role, server-only)
 │   ├─ matching/           deterministic scoring engine
 │   ├─ applications/       application lifecycle
 │   ├─ selections/         final selection + shortlist + capacity
 │   ├─ notifications/      in-app notifications, idempotent emit
 │   └─ permissions/        role helpers (student/company/teacher/admin)
 └─ types/domain.ts         canonical TypeScript models (camelCase)

Supabase (Postgres)
 ├─ profiles, companies, company_users
 ├─ students, courses, skills, interests (+ join tables)
 ├─ projects, project_weights, project_required/recommended_* , project_interests
 ├─ applications, matches, selection_decisions
 ├─ notifications, audit_events
 └─ RLS policies + SECURITY DEFINER helper functions + audit triggers on every table
```

Data virtaa aina Supabase-skeeman läpi: sekä selain (RLS-rajattu istunto) että palvelin (service role vain valikoiduissa toiminnoissa, ei koskaan selaimessa).

## 4. Mitä toimitettiin (What was delivered)

- Koko `projects`-mallin skeema ja RLS (18 migraatiotiedostoa, `supabase/migrations/`)
- Kaikki roolit: student, company, teacher, admin — kirjautuminen, oikeudet, näkymät
- Matching-moottori: 8 painotettua kriteeriä, summa 100, deterministinen, selitys FI/EN
- Top 3 -yksityisyys: vain yritys/opettaja/admin näkee ranking-listan
- Hakemusten koko elinkaari: haku, shortlist, peruminen (withdraw), valintapäätös, kapasiteettirajoitus
- Ilmoitukset (in-app), idempotentit (ei tuplailmoituksia)
- Audit-loki jokaisesta arkaluontoisesta kirjoituksesta + `GET /api/audit` (teacher/admin)
- Yksikkötestit (`npm test`, ~20 testitiedostoa) ja API-smoke-skriptit
- Dokumentaatio: API-sopimus, skeema, turvallisuus, testaus, matching-algoritmi

## 5. Tunnetut rajoitukset (Known limits)

- Ei oikeaa sähköpostia/SMTP:tä — ilmoitukset vain sovelluksen sisällä
- Opinnäytetyöt (thesis) eivät kuulu MVP:hen
- Ei maksuja, chattia, mobiilisovellusta tai ulkoista tekoäly-API:a matchingissa
- Selain-E2E (#120 / #121) on vielä manuaalinen / flaky browser-MCP — API-smoket (`npm run smoke:flows`, `smoke:security`) kattavat backend-polut
- Ei automaattista lopullista valintaa — yritys tekee aina päätöksen ihmisenä

## 6. Miten demota (How to demo)

1. `supabase db reset` (skeema + seed-data) ja `npm run dev`
2. Kirjaudu opiskelijana (`aino.virtanen@students.oamk.fi` / `LocalDemoOnly!1`) → profiili → projektit → matching-selitys → hakemus
3. Kirjaudu yrityksenä (`contact@nordicsoft.example`) → hakijalista pisteineen → Top 3 → valintapäätös
4. Kirjaudu opettajana (`teacher.demo@oamk.fi`) → oversight-näkymä kaikkiin projekteihin/hakemuksiin + `GET /api/audit`
5. Näytä ilmoitus opiskelijalle valinnan jälkeen (`GET /api/notifications`)

Katso myös: `docs/DEMO_CHECKLIST.md` (yksityiskohtainen ennen-demoa-lista), `docs/TESTING.md` (yksityisyystestit).
