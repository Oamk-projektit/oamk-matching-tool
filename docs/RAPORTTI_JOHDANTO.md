# Raportin johdanto ja tavoite

<!--
SHARED — Tommi + Venla
Issue: #149

Tommi kirjoitti teknisen taustan ja tavoitteen backendin näkökulmasta.
Venla täydentää käyttäjä-/UI-näkökulman ennen lopullista yhdistämistä.
-->

## 1. Johdanto

OAMK Matching Tool on Oulun ammattikorkeakoulun opiskelijaprojekti, jonka tavoitteena on helpottaa opiskelijoiden ja yritysten projektien / harjoittelupaikkojen yhteensovittamista. Järjestelmä tarjoaa opiskelijalle profiilin ja selitettävät suositukset, yritykselle projektinhallinnan ja hakijoiden järjestämisen sopivuuspisteiden mukaan sekä opettajalle oversight-näkymän.

Työ on jaettu kahteen päävastuuseen:

| Vastuu | Tekijä | Painopiste |
|--------|--------|------------|
| Backend, tietokanta, matching | Tommi | Supabase, `/api`, algoritmi, turvallisuus |
| Frontend, UX, mock→API | Venla | Näkymät, komponentit, integraatio |

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

## 4. Tekninen lähestymistapa (Tommi)

- Yksi Next.js-sovellus (App Router) + Supabase Auth/Postgres
- Yhteinen tyyppi- ja API-sopimus (`types/domain.ts`, `docs/API.md`)
- Kanoninen `projects`-malli (legacy `/api/opportunities` → 410)
- Deterministinen matching ilman ulkoista AI:ta (läpinäkyvyys + `weights_snapshot`)
- RLS + roolipohjainen API-autentikointi + audit-loki
- Live-smoket: `npm run smoke:flows` / `smoke:security`

Frontend-arkkitehtuuri ja käyttäjäpolut: **Venla täydentää**.
