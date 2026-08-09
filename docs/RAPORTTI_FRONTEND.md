# OAMK Matching Tool — Frontend-raportti

**Alkuperäinen tekijä:** Venla  
**Viimeistely / raportti:** Tommi (luovutus 9.8.2026 — Venla ei ole enää projektissa)  
**Issue:** GitHub #126 / #100 (#150 / #124)  
**OAMK-projekti:** osa raporttipakettia — aloitus `docs/RAPORTTI.md`

Tämä dokumentti on projektiraportin **frontend- ja UX-osuus**. Backend: `docs/RAPORTTI_BACKEND.md`.

---

## 1. Tavoite

Frontendin tavoite MVP:ssä on tarjota roolipohjaiset näkymät, joilla:

1. opiskelija hallitsee profiiliaan ja näkee oman matching-tuloksensa selityksineen
2. yritys hallitsee projekteja, näkee hakijat / Top 3 ja tekee valinnan
3. opettaja valvoo projekteja, opiskelijoita ja audit-lokia
4. UI käyttää samaa `projects`-sopimusta kuin backend (`types/domain.ts`, `docs/API.md`)

---

## 2. Arkkitehtuuri

Sovellus on yksi Next.js App Router -projekti. Sivut elävät `app/*/page.tsx` -puussa; data kulkee thin clientin kautta Route Handlereihin.

```text
Selain
  │  cookie-sessio (Supabase Auth)
  ▼
middleware.ts          — session refresh + roolipohjaiset sivusuojat
  ▼
app/*/page.tsx         — roolinäkymät (client/server components)
  │
  ├─ components/ui/*   — Button, Card, Navbar, LanguageSwitcher, …
  ├─ components/auth/* — LoginForm, RegisterForm, RoleGuard
  └─ lib/api/client.ts — fetch + { data, meta } -unwrap
        ▼
      app/api/*        — backend (Tommi)
```

### Keskeiset polut

| Alue | Polkuja (esimerkkejä) |
|------|------------------------|
| Julkinen | `/`, `/login`, `/register` |
| Opiskelija | `/dashboard`, `/profile`, `/profile/edit`, `/projects`, `/matches`, `/applications`, `/notifications` |
| Yritys | `/company/dashboard`, `/company/projects`, `…/applicants`, `…/top`, `…/selections` |
| Opettaja | `/teacher/dashboard`, `/teacher/projects`, `/teacher/students`, `/teacher/audit` |
| Admin | `/admin/dashboard` |
| Design | `/style-guide` |

---

## 3. Design system ja komponentit

Dokumentoitu: `docs/DESIGN_SYSTEM.md`.

- Väripaletti OAMK-sinisellä (`#005EB8`), statusvärit success/error/warning
- UI-kirjasto `components/ui/*`: Button, Input, Select, Card, Badge, StatusBadge, Navbar, Alert, Empty/Error/Loading states, LanguageSwitcher
- Layout: `components/layout/AppShell.tsx`
- Yrityslomakkeet: `components/company/ProjectForm.tsx`, `MultiSelectField.tsx`

Visuaalinen kieli on käytännöllinen MVP-tyyli (Tailwind + system-fontit), ei erillistä brand-kampanjasivua.

---

## 4. Käyttäjäpolut (UX)

### Opiskelija

1. Kirjautuminen / rekisteröityminen  
2. Profiilin täyttö (opinnot, kurssit, taidot, kiinnostukset, saatavuus)  
3. Projektien selaus ja suodatus  
4. Matching: `runMyMatches` / `getMyMatches` — **vain oma tulos + FI/EN-selitys**  
5. Hakemus → ilmoituskeskus  

### Yritys

1. Projektin luonti / muokkaus (`projectType`, painot summaan 100, vaatimukset)  
2. Julkaisu  
3. Hakijalista score-järjestyksessä  
4. Top 3 -näkymä  
5. Shortlist + lopullinen valinta (kapasiteetti ≤ `positions`)  

### Opettaja

1. Oversight kaikkiin projekteihin / opiskelijoihin  
2. Audit-loki (`/teacher/audit`)  

Yksityisyys UI:ssa vastaa backend-sääntöjä: opiskelijalle ei Top 3 -listaa; yritykset eivät näe toistensa hakijoita.

---

## 5. Mock → live -integraatio

Venla rakensi näkymät mock-datalla. Integraatio live-API:in (#143) tehtiin yhteisellä clientillä:

- Kanoninen client: `lib/api/client.ts`
- Alias yhteensopivuuteen: `lib/shared/api-client.ts`
- Auth: `lib/auth/AuthProvider.tsx` + Supabase-sessio
- Legacy `/api/opportunities` → **410 Gone** (UI ei käytä)

Tommi viimeisteli matching-reitit (`/api/matches/me`, `/api/matches/run`) ja varmisti, että `/matches`-sivu käyttää niitä.

---

## 6. Kielivalinta (FI/EN)

`LanguageSwitcher` + käyttäjän `preferredLanguage` / locale matching-selityksissä. Matching-API hyväksyy `locale: "fi" | "en"`.

---

## 7. Testaus frontendiin liittyen

| Taso | Tila |
|------|------|
| Unit (privacy / e2e-rules) | `lib/mvp/privacy.test.ts`, `e2e-rules.test.ts` |
| API-smoke (UI:n takana) | `npm run smoke:student` / `company` / `teacher` / `flows` |
| Selain-E2E | Manuaalinen / flaky (#120 / #121) — checklist `docs/DEMO_CHECKLIST.md` |

Frontendillä ei ole erillistä Playwright-CI:tä MVP:ssä.

---

## 8. Tunnetut rajoitukset

- Selain-E2E CI puuttuu  
- Mobiili = perusresponsiivisuus, ei erillistä mobiili-UX:ää  
- Visuaalinen brand polish rajattu MVP:hen  
- SMTP ei UI:ssa — vain in-app -ilmoitukset  

---

## 9. Yhteenveto

Frontend-MVP toimittaa demoon tarvittavat roolinäkymät, design systemin ja live-API-kytkennän. Alkuperäinen UI-työ oli Venlan; raportointi ja integraation viimeistely siirtyivät Tommille Venlan poistuttua projektista. Backend- ja frontend-osuudet jakavat saman `projects`-sopimuksen, joten demopolku voidaan ajaa UI:lla tai smoke/Postman-varmistuksella.
