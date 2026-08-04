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
- RLS ja service role -erottelu pitävät salaisuudet palvelimella.
- Postman + Bearer-token mahdollistaa backend-testauksen ilman valmista UI:ta.

### [VENLA]

*(Venla täydentää: UI, käyttäjäpolut, mock-datan hyödyt.)*

## Mitä ei saatu valmiiksi / rajattiin

### [TOMMI]

- Oikea SMTP-sähköposti → korvattu in-app -ilmoituksilla + `email-stub`
- Live E2E-CI Supabasea vasten
- ML-pohjainen matching
- Tuotantodeployn suorittaminen opettajan ympäristöön (ohjeet dokumentoitu)

### [VENLA]

*(Venla täydentää.)*

## Haasteet ja oppitunnit

### [TOMMI]

- Sprintti 1:n `projects`-malli piti laajentaa `opportunities` + `applications` -sopimukseen.
- Matching-kirjoitukset vaativat huolellista RLS vs service role -suunnittelua.
- Middleware `/`-polun `startsWith`-bugi olisi avannut kaikki sivut “julkisiksi”.

## Algoritmin läpinäkyvyys ja luotettavuus

- Sama syöte → sama score (unit-testattu).
- Selitysteksti kertoo matched/missing skills & courses.
- Lopullinen valinta jää ihmiselle (opettaja hyväksyy/hylkää hakemuksen).
- Painotukset ovat opportunitykohtaisesti konfiguroitavissa.

## Eettiset näkökohdat

- Algoritmi vertaa ilmoitettuja taitoja/kursseja, ei taustamuuttujia kuten nimeä tai sukupuolta.
- Mahdollinen vinouma: jos vaaditut kurssit/taidot on määritelty kapeasti, osa opiskelijoista tippuu systemaattisesti — siksi explanation + manuaalinen päätös.
- Opiskelijan tulee voida ymmärtää, miksi score on matala (suositus-kenttä).

## Jatkokehitys

1. SMTP / push-ilmoitukset stubbin tilalle  
2. Analytiikka opettajalle  
3. Pehmeät taidot / portfolio matchingiin  
4. Automaattiset integraatiotestit  
5. Mobiiliystävällisempi UI *(Venla)*  

## Yhteenveto

### [TOMMI]

Backend-MVP täyttää sovitun teknisen rajauksen: skeema, RLS, API, matching ja dokumentaatio ovat paikallaan integraatiota varten.

### [VENLA]

*(Venla tiivistää frontend-osuuden.)*
