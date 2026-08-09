# Raportin johdanto ja tavoite

<!--
SHARED — alun perin Tommi + Venla (#149)
Venla ei ole enää projektissa; UI-/käyttäjäosuuden täydensi Tommi 9.8.2026.
-->

## 1. Johdanto

OAMK Matching Tool on Oulun ammattikorkeakoulun opiskelijaprojekti, jonka tavoitteena on helpottaa opiskelijoiden ja yritysten projektien / harjoittelupaikkojen yhteensovittamista. Järjestelmä tarjoaa opiskelijalle profiilin ja selitettävät suositukset, yritykselle projektinhallinnan ja hakijoiden järjestämisen sopivuuspisteiden mukaan sekä opettajalle oversight-näkymän.

Työ jaettiin alun perin kahteen päävastuuseen. Venla poistui projektista ennen loppuraporttia; Tommi viimeisteli backendin lisäksi frontend-integraation ja raportin UI-osuuden.

| Vastuu | Alkuperäinen tekijä | Lopputila |
|--------|---------------------|-----------|
| Backend, tietokanta, matching | Tommi | Valmis (`projects`-malli, RLS, API, smoke) |
| Frontend, UX, mock→API | Venla → Tommi (luovutus) | Näkymät ja live-API käytössä; raportti `RAPORTTI_FRONTEND.md` |

## 2. Tavoite

Ensimmäisen MVP:n tavoite on **toimiva demo**, jossa:

1. opiskelijaprofiili voidaan tallentaa
2. projekteja / harjoitteluita voidaan selata ja hallita (`projects`)
3. hakemus voidaan jättää
4. matching tuottaa selitettävän pistemäärän (0–100) ja FI/EN-selityksen
5. yritys näkee hakijat / Top 3; opiskelija näkee vain oman tuloksensa
6. yritys tekee lopullisen valinnan (algoritmi ei automaattivalitse)
7. toteutus dokumentoidaan raporttiin

## 3. Rajaus

Katso `docs/MVP_SCOPE.md`. Ulkopuolelle jätettiin muun muassa maksut, chat, mobiilisovellus, thesis-aiheet ja automaattinen lopullinen valinta ilman ihmistä.

## 4. Tekninen lähestymistapa

### Backend (Tommi)

- Yksi Next.js-sovellus (App Router) + Supabase Auth/Postgres
- Yhteinen tyyppi- ja API-sopimus (`types/domain.ts`, `docs/API.md`)
- Kanoninen `projects`-malli (legacy `/api/opportunities` → 410)
- Deterministinen matching ilman ulkoista AI:ta (läpinäkyvyys + `weights_snapshot`)
- RLS + roolipohjainen API-autentikointi + audit-loki
- Live-smoket: `npm run smoke:flows` / `smoke:security`

### Frontend ja käyttäjäpolut (Venla → Tommi)

Käyttöliittymä rakennettiin Next.js App Router -sivuina rooleittain (`app/dashboard`, `app/company/*`, `app/teacher/*`). Venla toteutti mock-pohjaiset näkymät, layoutin, design systemin (`docs/DESIGN_SYSTEM.md`) ja FI/EN-vaihdon. Tommi kytki näkymät live-API:in (`lib/api/client.ts`), korjasi middleware-roolisuojausta ja täydensi matching-/valintapolkuja demoa varten.

Keskeiset käyttäjäpolut MVP:ssä:

1. **Opiskelija** — rekisteröityminen/kirjautuminen → profiili → projektit → oma match + selitys → hakemus → ilmoitukset
2. **Yritys** — projektin luonti/julkaisu → hakijalista → Top 3 → shortlist → valinta
3. **Opettaja** — oversight projekteihin ja opiskelijoihin + audit-loki

Yksityisyys UI:ssa: opiskelija ei näe Top 3- tai vertailurankia; yritysten data eristetään omistajuudella.
