# Pohdinta ja jatkokehitys

<!--
SHARED — alun perin Tommi + Venla (#152)
Venla ei ole enää projektissa; [VENLA]-kohdat täytetty Tommin toimesta luovutuksena 9.8.2026.
-->

## Mitä onnistui

### Backend (Tommi)

- Yhteinen API-sopimus esti frontend/backend-kenttien eriytymisen.
- Deterministinen matching + explanation tekee tuloksista perusteltavia demossa.
- Opiskelijan `GET /api/matches/me` erottaa oman tuloksen yrityksen Top 3 -listasta.
- RLS, service role -erottelu ja `profiles.role` -lock pitävät salaisuudet palvelimella.
- Smoke-skriptit (`smoke:student` / `company` / `teacher` / `security`) peittävät demopolun ilman selainta.

### Frontend / UX (Venla → Tommi)

- Mock-data mahdollisti UI-työn ennen live-API:a; sama sopimus (`types/domain.ts`) piti kentät synkassa.
- Roolikohtaiset näkymät (opiskelija / yritys / opettaja) tekevät demopolun seurattavaksi ilman erillistä admin-työkalua.
- Matching-kortti + FI/EN-selitys tukee läpinäkyvyyttä: opiskelija näkee *miksi* piste syntyi, ei vain lukua.
- Live-kytkentä `lib/api/client.ts`:n kautta poisti mock-haarojen ylläpidon demossa.

## Mitä ei saatu valmiiksi / rajattiin

### Backend (Tommi)

- Oikea SMTP-sähköposti → korvattu in-app -ilmoituksilla + email-stub
- Selain-E2E CI:ssä (#120 / #121) — API-smoket OK, manuaalinen selain vielä
- ML-pohjainen matching
- Thesis-aiheet ja pehmeät taidot matchingissa

### Frontend / UX (Venla → Tommi)

- Automaattinen selain-E2E (Playwright/CI) jäi tekemättä; UI:ta testataan checklistillä + API-smokeilla
- Mobiilioptimointi jäi perusresponsiivisuuteen (Navbar / hamburger), ei erillistä mobiilisuunnittelua
- Visuaalinen polish (brand-fontit, vahvempi landing) ei ollut MVP-kriittinen

## Haasteet ja oppitunnit

### Backend (Tommi)

- Sprintin aikana `opportunities`-välimalli poistettiin; kanoniseksi jäi `projects` + company-omistus.
- Matching-kirjoitukset vaativat huolellista RLS vs service role -suunnittelua sekä `weights_snapshot`-jäädytyksiä.
- Middleware `/`-polun `startsWith`-bugi olisi avannut kaikki sivut “julkisiksi”.
- Privilege escalation `profiles.role` -päivityksen kautta piti lukita migraatiolla.

### Frontend / luovutus

- Kun Venla poistui, mock→API-integraatio ja raportin UI-tekstit siirtyivät Tommille. Sopimuskeskeinen kehitys helpotti jatkamista: UI kutsui jo samoja tyyppejä.
- Browser-MCP / manuaalinen E2E oli epäluotettava; siksi demovarmistus nojaa `smoke:flows` + Postmaniin ja checklistiin.

## Algoritmin läpinäkyvyys ja luotettavuus

- Sama syöte → sama score (unit-testattu).
- Selitysteksti kertoo matched/missing skills & courses (FI/EN).
- Lopullinen valinta jää ihmiselle (yritys shortlistaa / valitsee).
- Painotukset ovat projektikohtaisesti konfiguroitavissa (summa 100).

## Eettiset näkökohdat

- Algoritmi vertaa ilmoitettuja taitoja/kursseja, ei taustamuuttujia kuten nimeä tai sukupuolta.
- Mahdollinen vinouma: jos vaaditut kurssit/taidot on määritelty kapeasti, osa opiskelijoista tippuu systemaattisesti — siksi explanation + manuaalinen päätös.
- Opiskelija ei näe muiden hakijoiden pisteitä; Top 3 on vain staff/yritys.

## Jatkokehitys

1. SMTP / push-ilmoitukset stubbin tilalle  
2. Analytiikka opettajalle  
3. Pehmeät taidot / portfolio matchingiin  
4. Selain-E2E CI:ssä (`smoke:flows` laajennus / Playwright)  
5. Mobiiliystävällisempi UI ja saavutettavuustarkistus  

## Yhteenveto

### Backend (Tommi)

Backend-MVP täyttää sovitun teknisen rajauksen: `projects`-skeema, RLS, API, matching, valinnat, audit ja dokumentaatio ovat paikallaan demoa ja raporttia varten.

### Frontend (Venla → Tommi)

Frontend-MVP: roolinäkymät, design system, FI/EN ja live-API-kytkentä riittävät demoon. Venlan poistuttua Tommi dokumentoi UI-osuuden (`docs/RAPORTTI_FRONTEND.md`) ja täydensi tämän pohdinnan käyttäjänäkökulmasta. Avoimeksi jää lähinnä manuaalinen selain-dry-run (#120 / #121) ennen live-esitystä (#153).
