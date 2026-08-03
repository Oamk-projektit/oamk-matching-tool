# OAMK Matching Tool

Next.js + Supabase MVP that matches students to projects and internships.

- **Frontend (Venla):** UI pages, components, mock data  
- **Backend (Tommi):** Supabase schema, RLS, `/api/*` routes, matching engine

## Quick start

```bash
npm install
cp .env.example .env.local   # fill Supabase keys
npm run dev
```

Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Backend docs

| Doc | Contents |
|-----|----------|
| [docs/API.md](docs/API.md) | REST contract |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database tables, RLS, indexes |
| [docs/BACKEND.md](docs/BACKEND.md) | Env vars, deploy, smoke tests |
| [docs/VENLA_TASKS.md](docs/VENLA_TASKS.md) | Frontend integration follow-ups |

```bash
npm test          # unit tests (matching + validation)
npm run build     # production build check
```

Database migrations: `supabase/migrations/` (apply with Supabase CLI or SQL editor).

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm test
```
