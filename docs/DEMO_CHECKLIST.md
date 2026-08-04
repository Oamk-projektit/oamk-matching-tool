# Demo-checklist

<!--
SHARED — Tommi + Venla
Issues: #147, #153
-->

## Ennen demoa

### [TOMMI] Backend

- [ ] Migraatiot ajettu Supabaseen (`supabase/migrations/`)
- [ ] Seed ajettu paikalliseen/demo-ympäristöön (`supabase/seed.sql`)
- [ ] `.env.local` / host env: URL, anon, service role
- [ ] `npm run dev` käynnissä
- [ ] `npm test` vihreä
- [ ] `npm run smoke` (valinnainen, vaatii seed + verkko)

### [VENLA] Frontend

- [ ] Login toimii Supabase-sessiolla (ei pelkkä mock)
- [ ] Opiskelijapolku: profiili → projektit → matching → hakemus
- [ ] Opettajapolku: projekti → hakijat score-järjestyksessä
- [ ] Käytä `lib/shared/demo-fixtures.ts` jos tarvitaan offline-fallback

## Demo-tilit (seed)

| Rooli | Email | Salasana |
|-------|-------|----------|
| Teacher | `teacher.demo@oamk.fi` | `LocalDemoOnly!1` |
| Student (vahva match) | `aino.virtanen@students.oamk.fi` | `LocalDemoOnly!1` |
| Student | `mikko.korhonen@students.oamk.fi` | `LocalDemoOnly!1` |

Kiinteät ID:t: `lib/shared/demo-fixtures.ts`.

## Esityksen juoni (ehdotus)

1. Health / Me (backend elossa)  
2. Aino: matching top 3 + selitys  
3. Hakemus Campus portal -projektiin  
4. Teacher: hakijalista scoreineen + accept  
5. Ilmoitus / email-stub (lokissa tai notifications-API)

## Shared fixture-import

```ts
import { DEMO_STUDENTS, DEMO_MATCHES } from '@/lib/shared/demo-fixtures'
```
