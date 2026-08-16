# Automated test users and data

The automated suite uses fictional `.test` addresses only. They are separate from the existing local demo accounts in `supabase/seed.sql`.

## Users

| Account | Role | Scenario |
|---|---|---|
| `student1@oamk-matching.test` | `student` | Strong AI/Python match |
| `student2@oamk-matching.test` | `student` | Medium AI match |
| `student3@oamk-matching.test` | `student` | Deliberately weak AI match |
| `teacher1@oamk-matching.test` | `teacher` | Student, project and audit oversight |
| `teacher2@oamk-matching.test` | `teacher` | Second staff account for authorization checks |
| `company1@oamk-matching.test` | `company` | Owns AI, frontend and backend projects |
| `company2@oamk-matching.test` | `company` | Owns mobile and analytics projects |

The AI project has deterministic fixture scores of 96, 55 and 18 for student1, student2 and student3. The seed also creates frontend/React/TypeScript, backend/PostgreSQL/REST API, mobile/React Native and data analytics projects.

## Seed

The seed is fail-closed. It requires a local Supabase URL, a service-role key, a runtime password and two explicit confirmations:

```powershell
$env:TEST_SEED_ALLOW = 'true'
$env:TEST_SEED_CONFIRM = 'oamk-matching-test-data-v1'
$env:TEST_SEED_PASSWORD = [guid]::NewGuid().ToString() + [guid]::NewGuid().ToString()
node scripts/seed-test-data.mjs
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` first, or load them from `.env.local` with the local Supabase CLI. The script refuses production and refuses non-localhost Supabase URLs. Re-running it updates the same users and rows; it does not create duplicates.

For a clean test-data reset before reseeding:

```powershell
node scripts/seed-test-data.mjs --reset
```

Reset deletes only rows with the fixed test UUIDs. Auth users are retained and their password/metadata are refreshed. To remove the Auth accounts as well, use the local Supabase dashboard or CLI with the fixed `.test` addresses; never run cleanup against production.

## Commands

```powershell
npm run test                 # unit tests
npm run test:integration     # local seed + RLS integration tests
npm run test:e2e:smoke       # critical browser smoke suite
npm run test:e2e             # complete Playwright suite
npm run test:e2e:ui          # Playwright UI mode
npm run test:all             # verify + integration + complete E2E
```

`test:integration` and `test:seed` intentionally fail unless `TEST_SEED_ALLOW=true`, `TEST_SEED_CONFIRM=oamk-matching-test-data-v1`, `TEST_SEED_PASSWORD` and local Supabase credentials are present. The test password is never stored in source code or logged.

## Coverage

Unit tests cover pure matching calculations, score bounds, deterministic explanations and ordering. Integration tests cover canonical roles, student peer-score isolation and company project isolation through Supabase RLS. Playwright covers login for student/company/teacher, role guards, logout, student match details, company match ordering and teacher oversight pages. Project form editing/publishing and full selection workflows still depend on the current UI controls and remain in the manual acceptance checklist until stable selectors and non-destructive reset fixtures are available.

Playwright stores the failing URL in the report, screenshots on failure, traces on retry and video on failure. CI uploads `playwright-report/` as an artifact when the browser job fails.
