# Projektiraportti — OAMK Matching Tool

**Kurssiprojekti / repositorio:** [Oamk-projektit/oamk-matching-tool](https://github.com/Oamk-projektit/oamk-matching-tool)  
**Kanban:** [OAMK Matching Tool – Project Plan](https://github.com/orgs/Oamk-projektit/projects/2)  
**Tila:** Valmis MVP-raporttipaketti (päivitetty 9.8.2026)  
**Tekijät:** Tommi (backend + luovutus); Venla (frontend-pohja, poistui projektista)

Tämä kansio (`docs/RAPORTTI*.md`) on **OAMK-projektin raporttitoimitus**. Aloita tästä tiedostosta ja lue osiot järjestyksessä.

<!--
SHARED — Tommi (+ Venlan UI-pohja)
Venla poistui projektista; Tommi täydensi raportin UI-/johdanto-/pohdintaosuudet 9.8.2026.
-->

## Lukemisjärjestys

1. [Johdanto ja tavoite](./RAPORTTI_JOHDANTO.md) — konteksti, tavoite, rajaus, käyttäjäpolut  
2. [Backend ja matching](./RAPORTTI_BACKEND.md) — skeema, API, RLS, algoritmi, testaus  
3. [Frontend ja UX](./RAPORTTI_FRONTEND.md) — näkymät, design system, live-API  
4. [Pohdinta ja jatkokehitys](./RAPORTTI_POHDINTA.md) — onnistumiset, haasteet, etiikka, jatko  
5. Tukiaineisto: [MVP_SCOPE.md](./MVP_SCOPE.md), [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md), [PROJECT_WORK.md](./PROJECT_WORK.md)

Tekninen sopimus: [SHARED_CONTRACT.md](./SHARED_CONTRACT.md), [API.md](./API.md), [SECURITY.md](./SECURITY.md).

## Sisällysluettelo

| Osio | Tiedosto | Omistaja | Tila |
|------|----------|----------|------|
| Johdanto ja tavoite | [RAPORTTI_JOHDANTO.md](./RAPORTTI_JOHDANTO.md) | SHARED → Tommi | Valmis (luovutus) |
| Backend ja matching | [RAPORTTI_BACKEND.md](./RAPORTTI_BACKEND.md) | Tommi | Valmis (`projects`-malli) |
| Frontend ja UX | [RAPORTTI_FRONTEND.md](./RAPORTTI_FRONTEND.md) | Venla → Tommi | Valmis (luovutusraportti) |
| Pohdinta ja jatkokehitys | [RAPORTTI_POHDINTA.md](./RAPORTTI_POHDINTA.md) | SHARED → Tommi | Valmis (luovutus) |
| MVP-rajaus | [MVP_SCOPE.md](./MVP_SCOPE.md) | SHARED | Valmis |
| Demo | [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md) | SHARED | Juoni + talking points + smoke-map |

## Lyhyt yhteenveto

OAMK Matching Tool yhdistää opiskelijat yritysten projekteihin ja harjoitteluihin (`projectType`: `company_project` | `internship`). MVP toimittaa:

- roolit student / company / teacher / admin (Supabase Auth + `profiles.role`)
- `projects`-skeeman, RLS:n ja REST-API:n (`/api/projects`, ei legacy `/api/opportunities`)
- deterministisen matching-pisteytyksen (0–100) FI/EN-selityksineen
- hakemukset, shortlistin ja yrityksen tekemän lopullisen valinnan (algoritmi ei automaattivalitse)
- in-app -ilmoitukset, audit-lokin ja API-smoke-testit (`smoke:flows`, `smoke:security`)

Frontend-näkymät rakennettiin alun perin mock-datalla (Venla); Tommi kytki ne live-API:in ja viimeisteli raportin Venlan poistuttua.

## Miten lukea repossa

- GitHubissa: avaa `docs/RAPORTTI.md` (tämä sivu) → seuraa taulukon linkkejä.  
- Paikallisesti: `docs/RAPORTTI.md` editorissa tai `npm run dev` ei tarvita pelkkään lukemiseen.  
- Demo: seuraa [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md) seed-tunnuksilla (`LocalDemoOnly!1`).
