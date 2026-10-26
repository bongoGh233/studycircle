# Supabase setup — local development

This guide is for a local integration test only. The app is not deployed. Without valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, sign-in and registration are unavailable: there are no demo accounts, mock sessions or bundled student records.

## Account and project

An existing Supabase account can be used if it has access to the project; a new account is not inherently required. If there is no project, create one together and decide its region, ownership/access, project name and development-vs-production separation before adding credentials. Do not share or place a service-role key in the browser app.

Current local state: `.env.local` is configured for project `ftacckkbppjqacwpigit` ("Uenr Study Circle", eu-west-1), and all migrations below are applied.

Copy `.env.example` to `.env.local` and set only:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

`.env.local` is git-ignored. Restart the local server after changing it. The current project has no `.env.local`, `.env`, or Supabase project configuration, so no account or project is connected from this local checkout.

## Apply migrations

Run in order using the selected project's SQL Editor:

1. `migrations/20261026090000_phase2_auth_profiles.sql`
2. `migrations/20261026120000_phase3_groups_requests_notifications.sql`
3. `migrations/20261026180000_verified_student_reads.sql`

The third migration limits group and peer-profile visibility to email-confirmed students whose department verification status is `VERIFIED` (moderators retain their moderation access). It does not determine whether a person truly attends UENR: the approval decision still needs reliable evidence and an agreed process.

## Auth setup

In Authentication → URL Configuration, use the local origin for the server being tested and add that origin's `/verify-email` callback. Keep email confirmation enabled. Before any student pilot, configure reliable email delivery and test password reset and email change behavior. Do not configure a public Site URL or deploy until the user and helper review readiness together.

The registration page reads department options from Supabase `departments`. The 31-department catalog from the official UENR page is loaded by `migrations/20261027000000_seed_uenr_departments.sql`; re-verify it with UENR before any public launch. Do not use an assumed email domain as the eligibility rule.

## Eligibility decision needed

Choose a university-approved way to confirm current UENR enrollment (for example, a manual evidence-review process approved by the project owner/UENR, or an official identity/email mechanism if UENR confirms one). Decide who may review, how evidence is handled and deleted, appeal/recheck rules, and whether students without an eligible institutional email can participate. Do not collect student-ID documents in this prototype until storage, retention and access policy are agreed.

The current schema has a moderator approval state but no evidence-upload or evidence-review workflow. Therefore it is a useful authorization gate, not yet sufficient proof that every approved person is a UENR student.

## What persists today

The current database-backed app features are Auth, profiles, department data, groups, memberships, join requests and notifications. Discussions, resource files/metadata, sessions, rules/acknowledgements, reports and audit history are not connected; their screens state that changes cannot be saved. No sample students are seeded. Preserve existing real project data; never truncate tables as part of setup.

## Isolation test plan

After migrations are applied and two authorized test accounts are approved:

- Confirm an unverified or email-unconfirmed account cannot read groups, group membership peers or other profile cards.
- Confirm verified student A sees only their department's groups and permitted group-member profile cards.
- Confirm B cannot read A's profile, join requests or notifications unless a narrowly scoped group-admin/member rule allows it.
- Confirm requests, memberships and notifications remain scoped to their owner/group and direct table writes are denied.
- Repeat with a different department, a suspended/unverified profile and a moderator, then inspect database logs for unexpected access.

This test has not run: the schema and catalog are in place, but there are no approved test accounts yet. Static policy review is not a substitute for two-account live RLS testing.

## Project checklist

1. Use existing Supabase access or create an account/project if needed.
2. Confirm project owner, region and development project choice.
3. Obtain the official UENR department catalog and agree how student status is verified.
4. Add local URL/anon key, run the migrations and load the approved department catalog. **Done** — 4 migrations applied, 31 departments loaded, Auth URLs set.
5. Test email delivery and run the isolation matrix with two approved accounts.
6. Review privacy, moderation, data retention, backups, domain and hosting.
7. Review readiness together before any public deployment.

Never expose the service-role secret, disable RLS, seed personal student data, or treat the current local demo screenshot as account-isolation evidence.
