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
npm run smoke:teacher   # #145 API path
npm run smoke:flows     # both
curl "http://localhost:3000/api/health?deep=1"
```
## Manual API

1. Import `docs/postman_collection.json`
2. Student token → matching + apply
3. Teacher token → applicants + accept
4. Check `GET /api/notifications` on both

## Security smoke

- [ ] Unauthenticated `GET /api/me` → 401 JSON (not HTML)
- [ ] Student cannot `POST /api/opportunities` → 403
- [ ] Student cannot list all students → 403
- [ ] Service role key not in client bundle

## Docs present

- [ ] `docs/API.md`, `docs/SCHEMA.md`, `docs/RAPORTTI_BACKEND.md`
- [ ] `docs/DEMO_CHECKLIST.md`

## Out of scope here (Venla)

- Browser click-through of pages
- Mock → UI wiring visual QA
