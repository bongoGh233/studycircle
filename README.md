# UENR StudyCircle

A student-led web app for UENR study groups. The local project is being prepared for Supabase-backed accounts and group data; it is not deployed and must not be treated as a public student service yet.

## Current status

Supabase-backed features in the code: email/password Auth, profiles, department verification workflow, groups, memberships, join requests and notifications. Discussions, resources/uploads, study sessions, group rules and acknowledgements, reports and audit history are **not** persisted and are clearly unavailable in the app. When Supabase credentials are absent, sign-in and registration are unavailable; the app does not supply demo users, credentials, mock sessions or student fixtures.

Student-only group discovery is gated by verified email plus a moderator-approved profile in the database. The current department list and verification evidence/process still need review with UENR; no email domain is assumed. Do not approve an account as UENR-eligible based solely on self-entered information.

The campus images/video and attribution files are retained. The dashboard slideshow and Discover layout/alignment are existing work and should be preserved.

## Run locally

Requires Node.js 18 or newer.

```powershell
npm install
npm run dev
```

Vite normally serves at <http://localhost:5173>. The local production preview is <http://localhost:4173> when started with `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`.

```powershell
npm run build
```

## Connect Supabase (local only)

Use an existing Supabase account if you already have access; create a new account only if needed. Create or choose the project together before entering its URL/key. Copy `.env.example` to `.env.local`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project URL and anon/public key only. Never place a service-role key in frontend configuration. Restart the local app after adding the values. `.env.local` is ignored by git.

Apply these migrations in order in the Supabase SQL editor:

1. `supabase/migrations/20261026090000_phase2_auth_profiles.sql`
2. `supabase/migrations/20261026120000_phase3_groups_requests_notifications.sql`
3. `supabase/migrations/20261026180000_verified_student_reads.sql`
4. `supabase/migrations/20261027000000_seed_uenr_departments.sql` (31 departments, verified against the official UENR page)

Then configure Auth Site URL and local `/verify-email` redirect URLs, and keep email confirmation enabled. Use only test accounts approved for development.

Current local state: `.env.local` points at project `ftacckkbppjqacwpigit` ("Uenr Study Circle", eu-west-1). All four migrations above are applied, the department catalog is loaded, and Auth Site URL is `http://localhost:5173` with `localhost`/`127.0.0.1` redirect URLs for ports 5173 and 4173. Email confirmation is required. A two-account RLS isolation test still needs to be run.

## Verification and launch gates

- Decide with UENR what evidence/process proves active student status and who is allowed to approve it. Do not guess an email domain or accept self-entered department as proof.
- The department catalog is now loaded from the official UENR page (31 departments, seed migration 4). Re-check it with UENR before any public launch.
- Apply migrations, then test with two verified accounts, an unverified account and an unrelated department. Unverified users must not enumerate groups or peer profile cards; a student must not read another student's private profile, requests or notifications.
- Verify owner-only profile/notification access, group department scoping, join decisions, role restrictions, email confirmations and reset-password/email behavior.
- Add persistent storage, RLS and tests for discussions, resources, sessions, rules/acknowledgements, reporting and audit records before advertising those features.
- Review privacy, retention, moderation, accessibility, load/backups, domain, hosting and rollback before any public deployment.

## Test status

The TypeScript/Vite production build passes. Source scans found no bundled demo credentials, mock sessions or sample students. The project is configured and the schema is applied, but the two-account RLS isolation test has not run yet because no approved test accounts exist. Do not interpret local empty states as database proof.

## Campus media

The landing page keeps the existing campus video and poster under `public/media/`; source attribution and license details are in `public/media/ATTRIBUTION.md`. Do not remove or replace those assets without a separate request.

## Project structure

- `src/pages/` — public, app, group and moderation screens
- `src/store/MockContext.tsx` — legacy-named context; no demo fallback remains
- `src/lib/` — Supabase client, error handling and database types
- `supabase/migrations/` — Auth/profile, groups and verified-student read policies
- `supabase/README.md` — local connection and readiness notes
