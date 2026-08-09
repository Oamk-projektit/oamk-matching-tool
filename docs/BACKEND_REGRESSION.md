# Backend regression checklist

<!--
TOMMI — issue #148 (backend portion)
Does not cover Venla UI E2E. Run before demo / PR merge.
-->

## Automated (no UI)

```bash
npm test
npm run verify          # tsc + unit tests
npx tsc --noEmit
# with dev server + seed + .env.local:
npm run smoke
npm run smoke:student   # #144 API path
npm run smoke:company   # company applicants / Top 3 / selection
npm run smoke:teacher   # #145 API path
npm run smoke:flows     # student + company + teacher
npm run smoke:security  # authz / privacy / role escalation probes
curl "http://localhost:3000/api/health?deep=1"
```
## Manual API

1. Import `docs/postman_collection.json`
2. Student token → `POST /api/matches/run` + `GET /api/matches/me` + apply
3. Company token → applicants + shortlist + selection
4. Teacher token → oversight + `GET /api/audit`
5. Check `GET /api/notifications` on student after selection

## Security smoke

- [ ] Unauthenticated `GET /api/me` → 401 JSON (not HTML)
- [ ] Student cannot `POST /api/projects` → 403
- [ ] `GET /api/opportunities` → 410 Gone
- [ ] Student cannot list all students → 403
- [ ] Student `GET /api/projects/:id/top-candidates` → 403
- [ ] Service role key not in client bundle
- [ ] `npm run smoke:security` green

## Docs present

- [ ] `docs/API.md`, `docs/SCHEMA.md`, `docs/RAPORTTI_BACKEND.md`
- [ ] `docs/DEMO_CHECKLIST.md`

## Out of scope here (Venla)

- Browser click-through of pages
- Mock → UI wiring visual QA
