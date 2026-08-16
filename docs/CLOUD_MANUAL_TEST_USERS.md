# Cloud manual QA users

This is a separate, human-triggered seed for long-lived manual QA accounts in the deployed Supabase Cloud project. It is not the local automation seed. The local `scripts/seed-test-data.mjs` remains localhost-only and is still the canonical source for automated tests.

## Current audit result

The repository does not contain a Cloud Supabase URL or project ref. The current `.env.local` points to `127.0.0.1`, and no Cloud ref was found in the repository or Git remote metadata. Do not infer a Cloud target from this repository. Obtain the exact project ref from the Supabase Dashboard or the deployed application's server environment before running the script.

Canonical roles are `student`, `company`, `teacher` and `admin`. A teacher has no separate profile table: the `profiles.role = 'teacher'` row provides teacher authorization. Students additionally need `students` plus course, skill and interest links. Companies need `companies` and `company_users`; projects and catalog links are included so company flows can be tested immediately.

## Accounts

| Email | Role | Manual scenario |
|---|---|---|
| `student1@oamk-matching.test` | `student` | Python, machine learning, AI and data-oriented profile |
| `student2@oamk-matching.test` | `student` | React, TypeScript, frontend and some Python |
| `student3@oamk-matching.test` | `student` | React Native/mobile-oriented weaker AI profile |
| `teacher1@oamk-matching.test` | `teacher` | Student, project, audit and oversight views |
| `teacher2@oamk-matching.test` | `teacher` | Second staff account and authorization checks |
| `company1@oamk-matching.test` | `company` | Owns three published manual QA projects |
| `company2@oamk-matching.test` | `company` | Separate tenant for company-isolation checks |

Auth metadata marks each account with `is_test_user: true`, `test_purpose: manual_qa` and a stable test marker. No production column or migration is added for this marker.

## Required safety variables

The script refuses to run unless every variable below is set. The password and service-role key must be supplied through the shell or a secret manager; never commit them or put them in a tracked file.

```powershell
$env:MANUAL_TEST_SEED_ALLOW = 'true'
$env:MANUAL_TEST_SEED_CONFIRM = 'OAMK-MANUAL-CLOUD-TEST-USERS-2026'
$env:MANUAL_TEST_ALLOWED_PROJECT_REF = '<exact-cloud-project-ref>'
$env:SUPABASE_URL = 'https://<exact-cloud-project-ref>.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = '<server-only-service-role-key>'
$env:MANUAL_TEST_USER_PASSWORD = '<runtime-password-at-least-12-characters>'
```

The script prints only the target project ref, target URL and mode before writing. It refuses localhost URLs, non-HTTPS Supabase URLs, mismatched project refs, production `NODE_ENV`, missing confirmation, and passwords shorter than 12 characters. The Auth Admin API uses `email_confirm: true`; no test email is sent.

## Commands

```powershell
npm run test:cloud-users
npm run test:cloud-users:reset
```

The seed is idempotent. Existing accounts are found by these exact emails, their password and manual-QA metadata are refreshed, and their canonical profile/data rows are upserted. Fixed IDs are used for the test entities.

Reset deletes only the fixed manual-QA project, catalog-link, student, company, profile and notification/audit rows, then deletes only the seven exact `.test` Auth emails. It does not delete by role, domain, or a broad table predicate. Reset uses the same Cloud confirmations as seed and is never included in CI, `test:all`, Playwright or any automatic workflow.

## Manual verification after seeding

1. In Supabase Dashboard, open Authentication → Users and confirm the seven `.test` accounts.
2. Check `profiles`, `students`, `companies` and `company_users` with the fixed marker/IDs.
3. Sign in to the deployed app as `student1`, `company1` and `teacher1`.
4. Confirm `/dashboard`, `/company/dashboard` and `/teacher/dashboard` open without server/client errors.
5. As `company1`, create or edit a project and run matching. As `company2`, confirm company-tenant isolation.

No Cloud seed or login verification has been performed from this workspace because the configured environment points to localhost and the Cloud project ref/credentials were not available. Do not substitute the local `.env.local` values for the Cloud variables.