# Pohdinta ja jatkokehitys

<!--
SHARED — Tommi + Venla
Issue: #152

Alla Tommin täyttämä tekninen pohdinta. Venla lisää UI/UX-osuuden
otsikoiden [VENLA] alle ennen lopullista raporttia.
-->

## Mitä onnistui

### [TOMMI]

- Yhteinen API-sopimus esti frontend/backend-kenttien eriytymisen.
- Deterministinen matching + explanation tekee tuloksista perusteltavia demossa.
- Opiskelijan `GET /api/matches/me` erottaa oman tuloksen yrityksen Top 3 -listasta.
- RLS, service role -erottelu ja `profiles.role` -lock pitävät salaisuudet palvelimella.
- Smoke-skriptit (`smoke:student` / `company` / `teacher` / `security`) peittävät demopolun ilman selainta.

### [VENLA]

*(Venla täydentää: UI, käyttäjäpolut, mock-datan hyödyt.)*

## Mitä ei saatu valmiiksi / rajattiin

### [TOMMI]

- Oikea SMTP-sähköposti → korvattu in-app -ilmoituksilla + email-stub
- Selain-E2E CI:ssä (#120 / #121) — API-smoket OK, manuaalinen selain vielä
- ML-pohjainen matching
- Thesis-aiheet ja pehmeät taidot matchingissa

### [VENLA]

*(Venla täydentää.)*

## Haasteet ja oppitunnit

### [TOMMI]

- Sprintin aikana `opportunities`-välimalli poistettiin; kanoniseksi jäi `projects` + company-omistus.
- Matching-kirjoitukset vaativat huolellista RLS vs service role -suunnittelua sekä `weights_snapshot`-jäädytyksiä.
- Middleware `/`-polun `startsWith`-bugi olisi avannut kaikki sivut “julkisiksi”.
- Privilege escalation `profiles.role` -päivityksen kautta piti lukita migraatiolla.

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
4. Selain-E2E CI:ssä (`smoke:flows` laajennus)  
5. Mobiiliystävällisempi UI *(Venla)*  

## Yhteenveto

### [TOMMI]

Backend-MVP täyttää sovitun teknisen rajauksen: `projects`-skeema, RLS, API, matching, valinnat, audit ja dokumentaatio ovat paikallaan demoa ja raporttia varten.

### [VENLA]

*(Venla tiivistää frontend-osuuden.)*
