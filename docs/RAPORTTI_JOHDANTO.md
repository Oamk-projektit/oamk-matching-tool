# Raportin johdanto ja tavoite

<!--
SHARED — Tommi + Venla
Issue: #149

Tommi kirjoitti teknisen taustan ja tavoitteen backendin näkökulmasta.
Venla täydentää käyttäjä-/UI-näkökulman ennen lopullista yhdistämistä.
-->

## 1. Johdanto

OAMK Matching Tool on Oulun ammattikorkeakoulun opiskelijaprojekti, jonka tavoitteena on helpottaa opiskelijoiden ja projektien / harjoittelupaikkojen yhteensovittamista. Järjestelmä tarjoaa opiskelijalle profiilin ja suosituksia, opettajalle / yritykselle projektinhallinnan ja hakijoiden järjestämisen sopivuuspisteiden mukaan.

Työ on jaettu kahteen päävastuuseen:

| Vastuu | Tekijä | Painopiste |
|--------|--------|------------|
| Backend, tietokanta, matching | Tommi | Supabase, `/api`, algoritmi, turvallisuus |
| Frontend, UX, mock→API | Venla | Näkymät, komponentit, integraatio |

## 2. Tavoite

Ensimmäisen MVP:n tavoite on **toimiva demo**, jossa:

1. opiskelijaprofiili voidaan tallentaa
2. projekteja / harjoitteluita voidaan selata ja hallita
3. hakemus voidaan jättää
4. matching tuottaa selitettävän pistemäärän (0–100)
5. hakijat voidaan järjestää sopivuuden mukaan
6. toteutus dokumentoidaan raporttiin

## 3. Rajaus

Katso `docs/MVP_SCOPE.md`. Ulkopuolelle jätettiin muun muassa maksut, chat, mobiilisovellus ja automaattinen lopullinen valinta ilman ihmistä.

## 4. Tekninen lähestymistapa (Tommi)

- Yksi Next.js-sovellus (App Router) + Supabase Auth/Postgres
- Yhteinen tyyppi- ja API-sopimus (`types/*`, `docs/API.md`)
- Deterministinen matching ilman ulkoista AI:ta (läpinäkyvyys)
- RLS + roolipohjainen API-autentikointi

Frontend-arkkitehtuuri ja käyttäjäpolut: **Venla täydentää**.
