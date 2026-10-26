-- ============================================================================
-- UENR StudyCircle — Phase 2
-- Authentication profiles, departments, verification workflow and RLS.
--
-- Run this file in the Supabase dashboard: SQL Editor → New query → Run.
-- It is written to be safe to re-run.
--
-- Phase 2 scope: auth.users → public.profiles, department verification,
-- moderator review. Group and community data are handled by later migrations;
-- do not enable features until their persisted schema and policies are applied.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.user_role as enum ('STUDENT', 'MODERATOR');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.academic_level as enum ('100 Level', '200 Level', '300 Level', '400 Level');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.departments (
  id text primary key,
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default 'Student',
  department_id text references public.departments (id) on delete set null,
  programme text,
  academic_level public.academic_level,
  email_verified boolean not null default false,
  verification_status public.verification_status not null default 'UNVERIFIED',
  role public.user_role not null default 'STUDENT',
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 80),
  constraint profiles_programme_length check (programme is null or char_length(programme) <= 120)
);

create table if not exists public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- Nullable so deleting a moderator account is not blocked by the audit trail.
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision public.verification_status not null,
  note text,
  created_at timestamptz not null default now(),
  constraint verification_reviews_decision check (decision in ('VERIFIED', 'REJECTED')),
  constraint verification_reviews_note_length check (note is null or char_length(note) <= 500)
);

create index if not exists profiles_department_idx on public.profiles (department_id);
create index if not exists profiles_verification_status_idx on public.profiles (verification_status);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists verification_reviews_profile_idx on public.verification_reviews (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER lets the policy read profiles without recursively applying
-- the profiles RLS policy. It only ever returns a boolean.
create or replace function public.is_moderator(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_user_id
      and role = 'MODERATOR'
  );
$$;

-- Creates a profile when Supabase Auth creates an account. The sign-up form
-- passes display_name, department_id, programme and academic_level as user
-- metadata. Invalid or unknown department IDs are ignored (stored as null).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_display_name text := coalesce(
    nullif(trim(meta ->> 'display_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Student'
  );
  v_department_id text;
  v_programme text := left(nullif(trim(meta ->> 'programme'), ''), 120);
  v_level public.academic_level;
  v_status public.verification_status;
begin
  select d.id
    into v_department_id
    from public.departments d
   where d.id = nullif(trim(meta ->> 'department_id'), '')
     and d.is_active
   limit 1;

  if meta ->> 'academic_level' in ('100 Level', '200 Level', '300 Level', '400 Level') then
    v_level := (meta ->> 'academic_level')::public.academic_level;
  end if;

  v_status := case
    when v_department_id is not null then 'PENDING'::public.verification_status
    else 'UNVERIFIED'::public.verification_status
  end;

  insert into public.profiles (
    id, email, display_name, department_id, programme, academic_level,
    email_verified, verification_status
  )
  values (
    new.id,
    coalesce(new.email, ''),
    left(v_display_name, 80),
    v_department_id,
    v_programme,
    v_level,
    new.email_confirmed_at is not null,
    v_status
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Keeps the denormalised profile email / email_verified flag in sync when a
-- user confirms their address or changes it in Supabase Auth.
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform set_config('app.profile_system_update', 'on', true);

  update public.profiles
     set email = coalesce(new.email, ''),
         email_verified = (new.email_confirmed_at is not null)
   where id = new.id;

  perform set_config('app.profile_system_update', 'off', true);
  return new;
end;
$$;

-- Protects privileged columns on profile INSERT. A client may insert its own
-- profile (useful as a fallback), but it cannot grant itself a moderator role
-- or a verified status.
create or replace function public.guard_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_auth_email text;
  v_confirmed boolean;
begin
  if auth.uid() is not null and not public.is_moderator(auth.uid()) then
    select u.email, (u.email_confirmed_at is not null)
      into v_auth_email, v_confirmed
      from auth.users u
     where u.id = new.id;

    if v_auth_email is null then
      raise exception 'A profile can only be created for the signed-in account'
        using errcode = '42501';
    end if;

    new.email := v_auth_email;
    new.email_verified := coalesce(v_confirmed, false);
    new.role := 'STUDENT'::public.user_role;
    new.verified_at := null;
    new.verified_by := null;
    new.verification_status := case
      when new.department_id is not null then 'PENDING'::public.verification_status
      else 'UNVERIFIED'::public.verification_status
    end;
  end if;

  new.display_name := left(
    coalesce(
      nullif(trim(new.display_name), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Student'
    ),
    80
  );
  return new;
end;
$$;

-- Protects privileged columns on UPDATE and resets department verification
-- whenever a student changes department, programme or academic level.
-- SECURITY DEFINER RPCs can opt out with the app.profile_system_update flag.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_system_update boolean := coalesce(current_setting('app.profile_system_update', true), 'off') = 'on';
begin
  new.updated_at := now();

  if v_system_update then
    return new;
  end if;

  -- Service-role and dashboard SQL are trusted.
  if auth.uid() is null then
    return new;
  end if;

  if not public.is_moderator(auth.uid()) then
    -- A student can never write these directly.
    new.role := old.role;
    new.email := old.email;
    new.email_verified := old.email_verified;
    new.verified_at := old.verified_at;
    new.verified_by := old.verified_by;
    new.verification_status := old.verification_status;
    new.created_at := old.created_at;

    if new.department_id is distinct from old.department_id
       or new.programme is distinct from old.programme
       or new.academic_level is distinct from old.academic_level then
      new.verification_status := case
        when new.department_id is not null then 'PENDING'::public.verification_status
        else 'UNVERIFIED'::public.verification_status
      end;
      new.verified_at := null;
      new.verified_by := null;
    end if;
  end if;

  return new;
end;
$$;

-- Lets a student (re)submit their department for moderator review. Used after
-- a rejection, or when a new account already has a department on file.
create or replace function public.submit_verification()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to request verification'
      using errcode = '42501';
  end if;

  select *
    into v_profile
    from public.profiles
   where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.department_id is null then
    raise exception 'Add your department before requesting verification';
  end if;

  if v_profile.verification_status = 'VERIFIED' then
    raise exception 'Your department is already verified';
  end if;

  perform set_config('app.profile_system_update', 'on', true);

  update public.profiles
     set verification_status = 'PENDING'::public.verification_status,
         verified_at = null,
         verified_by = null
   where id = auth.uid();

  perform set_config('app.profile_system_update', 'off', true);
end;
$$;

-- Moderator-only review. The reviewer comes from the authenticated JWT, not
-- from a client-supplied ID, and every decision is written to an audit table.
create or replace function public.review_verification(
  p_student_id uuid,
  p_status public.verification_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_moderator(auth.uid()) then
    raise exception 'Only moderators can review verifications'
      using errcode = '42501';
  end if;

  if p_student_id = auth.uid() then
    raise exception 'Moderators cannot review their own verification'
      using errcode = '42501';
  end if;

  if p_status not in ('VERIFIED'::public.verification_status, 'REJECTED'::public.verification_status) then
    raise exception 'Decision must be VERIFIED or REJECTED';
  end if;

  if not exists (select 1 from public.profiles where id = p_student_id) then
    raise exception 'Student profile not found';
  end if;

  if p_status = 'VERIFIED'::public.verification_status
     and not exists (
       select 1
         from public.profiles
        where id = p_student_id
          and department_id is not null
     ) then
    raise exception 'Student must add a department before it can be verified';
  end if;

  update public.profiles
     set verification_status = p_status,
         verified_at = now(),
         verified_by = auth.uid()
   where id = p_student_id;

  insert into public.verification_reviews (profile_id, reviewer_id, decision, note)
  values (p_student_id, auth.uid(), p_status, nullif(trim(p_note), ''));
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_user_updated();

drop trigger if exists profiles_guard_insert on public.profiles;
create trigger profiles_guard_insert
  before insert on public.profiles
  for each row execute function public.guard_profile_insert();

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- 5. Row-level security
-- ---------------------------------------------------------------------------

alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.verification_reviews enable row level security;

-- Only active departments are exposed. Inactive departments stay hidden until
-- an admin surface exists in a later phase.
drop policy if exists "departments are readable" on public.departments;
create policy "departments are readable"
  on public.departments
  for select
  to anon, authenticated
  using (is_active);

drop policy if exists "profiles are readable by the owner or a moderator" on public.profiles;
create policy "profiles are readable by the owner or a moderator"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_moderator());

drop policy if exists "profiles can be created for the signed-in account" on public.profiles;
create policy "profiles can be created for the signed-in account"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles can be updated by the owner" on public.profiles;
create policy "profiles can be updated by the owner"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "reviews are readable by the student or a moderator" on public.verification_reviews;
create policy "reviews are readable by the student or a moderator"
  on public.verification_reviews
  for select
  to authenticated
  using (profile_id = auth.uid() or public.is_moderator());

-- ---------------------------------------------------------------------------
-- 6. Privileges
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant select on public.departments to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.verification_reviews to authenticated;

revoke all on function public.is_moderator(uuid) from public;
grant execute on function public.is_moderator(uuid) to authenticated;

revoke all on function public.submit_verification() from public;
grant execute on function public.submit_verification() to authenticated;

revoke all on function public.review_verification(uuid, public.verification_status, text) from public;
grant execute on function public.review_verification(uuid, public.verification_status, text) to authenticated;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_user_updated() from public;
revoke all on function public.guard_profile_insert() from public;
revoke all on function public.guard_profile_update() from public;

-- ---------------------------------------------------------------------------
-- 7. Department catalog
--    Intentionally no seed rows. Load only a university-confirmed catalog.
--    This avoids presenting development examples as official UENR departments
--    and avoids overwriting an existing project's real department records.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 8. Backfill profiles for accounts created before this migration
-- ---------------------------------------------------------------------------

insert into public.profiles (id, email, display_name, email_verified)
select
  u.id,
  coalesce(u.email, ''),
  left(
    coalesce(
      nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
      'Student'
    ),
    80
  ),
  (u.email_confirmed_at is not null)
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 9. Notes
-- ---------------------------------------------------------------------------
-- Promote a moderator after they sign up:
--   update public.profiles
--      set role = 'MODERATOR', verification_status = 'VERIFIED'
--    where email = 'moderator@your-domain.example';
--
-- Demote / reset if needed:
--   update public.profiles set role = 'STUDENT' where email = '...';
--
-- The service-role key must never be used in the browser bundle.
