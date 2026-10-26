-- ============================================================================
-- UENR StudyCircle — Phase 3
-- Study groups, memberships, join requests and notifications.
--
-- Run this file in the Supabase dashboard: SQL Editor → New query → Run.
-- Run the Phase 2 migration first. This file is written to be safe to re-run.
--
-- Phase 3 scope:
--   * create a group inside the creator's verified department
--   * discover groups in the same department
--   * send, withdraw and decide join requests
--   * notify group admins and applicants
--   * keep group member names private behind a narrow directory RPC
--
-- Posts, resources, rules, sessions and report moderation stay in Phase 4/5.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.group_type as enum ('COURSE', 'GENERAL');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.group_status as enum ('OPEN', 'CLOSED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_role as enum ('ADMIN', 'MEMBER');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.membership_status as enum ('ACTIVE', 'LEFT');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.join_request_status as enum ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_type as enum (
    'JOIN_REQUEST_RECEIVED',
    'JOIN_REQUEST_WITHDRAWN',
    'JOIN_REQUEST_DECIDED',
    'ANNOUNCEMENT',
    'SESSION_SCHEDULED',
    'SESSION_UPDATED',
    'SESSION_CANCELLED',
    'RULE_ACKNOWLEDGEMENT_REQUIRED',
    'REPORT',
    'MODERATION_ACTION'
  );
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  department_id text not null references public.departments (id) on delete restrict,
  group_type public.group_type not null default 'GENERAL',
  course_name text,
  programme text,
  academic_level public.academic_level,
  -- Nullable so deleting a creator account never deletes a group other
  -- students have joined. Group administration lives in group_memberships.
  created_by uuid references public.profiles (id) on delete set null,
  capacity integer not null default 10,
  status public.group_status not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_name_length check (char_length(name) between 3 and 80),
  constraint groups_description_length check (char_length(description) between 10 and 2000),
  constraint groups_course_name_length check (course_name is null or char_length(course_name) between 1 and 120),
  constraint groups_programme_length check (programme is null or char_length(programme) <= 120),
  constraint groups_capacity_range check (capacity between 2 and 50),
  constraint groups_course_requires_name check (group_type = 'GENERAL' or course_name is not null)
);

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  role public.membership_role not null default 'MEMBER',
  status public.membership_status not null default 'ACTIVE',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  constraint group_memberships_unique_student unique (group_id, student_id)
);

create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.join_request_status not null default 'PENDING',
  message text,
  decision_reason text,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint join_requests_message_length check (message is null or char_length(message) <= 500),
  constraint join_requests_reason_length check (decision_reason is null or char_length(decision_reason) <= 500)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists groups_department_status_idx
  on public.groups (department_id, status, created_at desc);
create index if not exists groups_created_by_idx
  on public.groups (created_by);

create index if not exists group_memberships_student_idx
  on public.group_memberships (student_id, status);
create index if not exists group_memberships_group_status_idx
  on public.group_memberships (group_id, status, role);

create index if not exists join_requests_student_idx
  on public.join_requests (student_id, created_at desc);
create index if not exists join_requests_group_status_idx
  on public.join_requests (group_id, status, created_at desc);
-- A student can have only one live request per group. Decided rows stay as
-- history, so a withdrawn or rejected student can apply again later.
create unique index if not exists join_requests_one_pending_per_group
  on public.join_requests (group_id, student_id)
  where status = 'PENDING';

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- 3. Helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER avoids recursively applying the membership RLS policy.
create or replace function public.is_group_admin(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.group_memberships
    where group_id = p_group_id
      and student_id = p_user_id
      and status = 'ACTIVE'
      and role = 'ADMIN'
  );
$$;

create or replace function public.is_group_member(
  p_group_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.group_memberships
    where group_id = p_group_id
      and student_id = p_user_id
      and status = 'ACTIVE'
  );
$$;

create or replace function public.current_department_id()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select department_id
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.group_in_my_department(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.groups
    where id = p_group_id
      and department_id = public.current_department_id()
  );
$$;

-- Only the fields needed to render names in a group are returned. Email,
-- role, verification details and moderator notes never leave public.profiles
-- through this function.
create or replace function public.list_profile_cards()
returns table (
  id uuid,
  display_name text,
  department_id text,
  programme text,
  academic_level public.academic_level
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.display_name,
    p.department_id,
    p.programme,
    p.academic_level
  from public.profiles p
  where auth.uid() = p.id
     or public.is_moderator()
     -- Active members of the same group can see each other.
     or exists (
       select 1
       from public.group_memberships mine
       join public.group_memberships theirs on theirs.group_id = mine.group_id
       where mine.student_id = auth.uid()
         and mine.status = 'ACTIVE'
         and theirs.student_id = p.id
         and theirs.status = 'ACTIVE'
     )
     -- A group admin can see the name of every applicant waiting for a decision.
     or exists (
       select 1
       from public.join_requests jr
       join public.group_memberships admin_membership
         on admin_membership.group_id = jr.group_id
       where jr.student_id = p.id
         and jr.status = 'PENDING'
         and admin_membership.student_id = auth.uid()
         and admin_membership.status = 'ACTIVE'
         and admin_membership.role = 'ADMIN'
     )
     -- Admins of groups in the viewer's department are public directory entries.
     or exists (
       select 1
       from public.group_memberships gm
       join public.groups g on g.id = gm.group_id
       where gm.student_id = p.id
         and gm.status = 'ACTIVE'
         and gm.role = 'ADMIN'
         and g.department_id = public.current_department_id()
     );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. RPCs
-- ---------------------------------------------------------------------------

-- Creates a group in the caller's verified department and makes the caller
-- its first admin. Client-supplied department IDs are deliberately ignored.
create or replace function public.create_group(
  p_name text,
  p_description text,
  p_group_type public.group_type,
  p_course_name text default null,
  p_programme text default null,
  p_academic_level public.academic_level default null,
  p_capacity integer default 10
)
returns public.groups
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_group public.groups%rowtype;
  v_name text := trim(coalesce(p_name, ''));
  v_description text := trim(coalesce(p_description, ''));
  v_course_name text := nullif(trim(p_course_name), '');
  v_programme text := nullif(trim(p_programme), '');
begin
  if auth.uid() is null then
    raise exception 'Sign in to create a study group'
      using errcode = '42501';
  end if;

  select *
    into v_profile
    from public.profiles
   where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  if not v_profile.email_verified then
    raise exception 'Verify your email address before creating a group'
      using errcode = '42501';
  end if;

  if v_profile.verification_status <> 'VERIFIED' then
    raise exception 'Your department must be verified before you can create a group'
      using errcode = '42501';
  end if;

  if v_profile.department_id is null then
    raise exception 'Add your department before creating a group'
      using errcode = '42501';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 80 then
    raise exception 'Group name must be between 3 and 80 characters';
  end if;

  if char_length(v_description) < 10 or char_length(v_description) > 2000 then
    raise exception 'Description must be between 10 and 2000 characters';
  end if;

  if p_capacity is null or p_capacity < 2 or p_capacity > 50 then
    raise exception 'Capacity must be between 2 and 50 students';
  end if;

  if p_group_type = 'COURSE' and v_course_name is null then
    raise exception 'Add the course name for a course group';
  end if;

  if v_course_name is not null and char_length(v_course_name) > 120 then
    raise exception 'Course name must be 120 characters or fewer';
  end if;

  if v_programme is not null and char_length(v_programme) > 120 then
    raise exception 'Programme must be 120 characters or fewer';
  end if;

  insert into public.groups (
    name,
    description,
    department_id,
    group_type,
    course_name,
    programme,
    academic_level,
    created_by,
    capacity,
    status
  )
  values (
    v_name,
    v_description,
    v_profile.department_id,
    p_group_type,
    case when p_group_type = 'COURSE' then v_course_name else null end,
    coalesce(v_programme, v_profile.programme),
    coalesce(p_academic_level, v_profile.academic_level),
    auth.uid(),
    p_capacity,
    'OPEN'
  )
  returning * into v_group;

  insert into public.group_memberships (group_id, student_id, role, status)
  values (v_group.id, auth.uid(), 'ADMIN', 'ACTIVE');

  return v_group;
end;
$$;

-- Sends a request only when the student passes both verification checks and
-- belongs to the group's department. The group row is locked so two requests
-- cannot both take the last seat.
create or replace function public.send_join_request(
  p_group_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_group public.groups%rowtype;
  v_profile public.profiles%rowtype;
  v_request_id uuid;
  v_message text := nullif(trim(p_message), '');
  v_member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to request to join a group'
      using errcode = '42501';
  end if;

  select *
    into v_group
    from public.groups
   where id = p_group_id
   for update;

  if not found then
    raise exception 'Group not found';
  end if;

  if v_group.status <> 'OPEN' then
    raise exception 'This group is not accepting new members';
  end if;

  select *
    into v_profile
    from public.profiles
   where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  if not v_profile.email_verified then
    raise exception 'Verify your email address before joining a group'
      using errcode = '42501';
  end if;

  if v_profile.verification_status <> 'VERIFIED' then
    raise exception 'Your department must be verified before joining a group'
      using errcode = '42501';
  end if;

  if v_profile.department_id is distinct from v_group.department_id then
    raise exception 'You can only join groups in your verified department'
      using errcode = '42501';
  end if;

  if v_message is not null and char_length(v_message) > 500 then
    raise exception 'Your introduction must be 500 characters or fewer';
  end if;

  if exists (
    select 1
    from public.group_memberships
    where group_id = v_group.id
      and student_id = auth.uid()
      and status = 'ACTIVE'
  ) then
    raise exception 'You are already a member of this group';
  end if;

  if exists (
    select 1
    from public.join_requests
    where group_id = v_group.id
      and student_id = auth.uid()
      and status = 'PENDING'
  ) then
    raise exception 'You already have a pending request for this group';
  end if;

  select count(*)
    into v_member_count
    from public.group_memberships
   where group_id = v_group.id
     and status = 'ACTIVE';

  if v_member_count >= v_group.capacity then
    raise exception 'This group is full';
  end if;

  insert into public.join_requests (group_id, student_id, status, message)
  values (v_group.id, auth.uid(), 'PENDING', v_message)
  returning id into v_request_id;

  insert into public.notifications (user_id, type, payload)
  select
    gm.student_id,
    'JOIN_REQUEST_RECEIVED',
    jsonb_build_object(
      'group_id', v_group.id,
      'group_name', v_group.name,
      'request_id', v_request_id,
      'student_id', auth.uid()
    )
  from public.group_memberships gm
  where gm.group_id = v_group.id
    and gm.status = 'ACTIVE'
    and gm.role = 'ADMIN'
    and gm.student_id <> auth.uid();

  return v_request_id;
end;
$$;

create or replace function public.withdraw_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.join_requests%rowtype;
  v_group public.groups%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in to withdraw a join request'
      using errcode = '42501';
  end if;

  select *
    into v_request
    from public.join_requests
   where id = p_request_id
   for update;

  if not found or v_request.student_id <> auth.uid() then
    raise exception 'Join request not found'
      using errcode = '42501';
  end if;

  if v_request.status <> 'PENDING' then
    raise exception 'Only pending requests can be withdrawn';
  end if;

  update public.join_requests
     set status = 'WITHDRAWN',
         updated_at = now()
   where id = v_request.id;

  select *
    into v_group
    from public.groups
   where id = v_request.group_id;

  if found then
    insert into public.notifications (user_id, type, payload)
    select
      gm.student_id,
      'JOIN_REQUEST_WITHDRAWN',
      jsonb_build_object(
        'group_id', v_group.id,
        'group_name', v_group.name,
        'request_id', v_request.id,
        'student_id', auth.uid()
      )
    from public.group_memberships gm
    where gm.group_id = v_group.id
      and gm.status = 'ACTIVE'
      and gm.role = 'ADMIN'
      and gm.student_id <> auth.uid();
  end if;
end;
$$;

-- The acting admin comes from auth.uid(). The group row is locked so parallel
-- decisions cannot exceed capacity. A rejection always needs a reason.
create or replace function public.decide_join_request(
  p_request_id uuid,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.join_requests%rowtype;
  v_group public.groups%rowtype;
  v_student public.profiles%rowtype;
  v_decision text := upper(trim(coalesce(p_decision, '')));
  v_reason text := nullif(trim(p_reason), '');
  v_member_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to decide join requests'
      using errcode = '42501';
  end if;

  if v_decision not in ('ACCEPT', 'REJECT') then
    raise exception 'Decision must be ACCEPT or REJECT';
  end if;

  select *
    into v_request
    from public.join_requests
   where id = p_request_id
   for update;

  if not found then
    raise exception 'Join request not found';
  end if;

  if v_request.status <> 'PENDING' then
    raise exception 'This request has already been decided';
  end if;

  if v_request.student_id = auth.uid() then
    raise exception 'You cannot decide a join request that you sent yourself';
  end if;

  select *
    into v_group
    from public.groups
   where id = v_request.group_id
   for update;

  if not found then
    raise exception 'Group not found';
  end if;

  if not public.is_group_admin(v_group.id, auth.uid()) then
    raise exception 'Only group administrators can decide join requests'
      using errcode = '42501';
  end if;

  if v_decision = 'REJECT' then
    if v_reason is null or char_length(v_reason) < 5 then
      raise exception 'A clear rejection reason is required (at least 5 characters)';
    end if;

    if char_length(v_reason) > 500 then
      raise exception 'The rejection reason must be 500 characters or fewer';
    end if;

    update public.join_requests
       set status = 'REJECTED',
           decision_reason = v_reason,
           decided_by = auth.uid(),
           decided_at = now(),
           updated_at = now()
     where id = v_request.id;

    insert into public.notifications (user_id, type, payload)
    values (
      v_request.student_id,
      'JOIN_REQUEST_DECIDED',
      jsonb_build_object(
        'group_id', v_group.id,
        'group_name', v_group.name,
        'decision', 'REJECTED',
        'decision_reason', v_reason,
        'request_id', v_request.id
      )
    );

    return;
  end if;

  -- Re-check eligibility at decision time: the applicant may have changed
  -- department or lost verification since sending the request.
  select *
    into v_student
    from public.profiles
   where id = v_request.student_id;

  if not found then
    raise exception 'Applicant profile not found';
  end if;

  if not v_student.email_verified
     or v_student.verification_status <> 'VERIFIED'
     or v_student.department_id is distinct from v_group.department_id then
    raise exception 'The applicant no longer meets the group eligibility rules';
  end if;

  select count(*)
    into v_member_count
    from public.group_memberships
   where group_id = v_group.id
     and status = 'ACTIVE';

  if v_member_count >= v_group.capacity then
    raise exception 'This group is full';
  end if;

  update public.join_requests
     set status = 'ACCEPTED',
         decision_reason = null,
         decided_by = auth.uid(),
         decided_at = now(),
         updated_at = now()
   where id = v_request.id;

  insert into public.group_memberships as gm (group_id, student_id, role, status, joined_at)
  values (v_group.id, v_request.student_id, 'MEMBER', 'ACTIVE', now())
  on conflict (group_id, student_id) do update
    set status = 'ACTIVE',
        -- Preserve an existing ADMIN role if a former admin is re-accepted.
        role = case
          when gm.role = 'ADMIN' then 'ADMIN'::public.membership_role
          else 'MEMBER'::public.membership_role
        end,
        joined_at = now(),
        left_at = null;

  insert into public.notifications (user_id, type, payload)
  values (
    v_request.student_id,
    'JOIN_REQUEST_DECIDED',
    jsonb_build_object(
      'group_id', v_group.id,
      'group_name', v_group.name,
      'decision', 'ACCEPTED',
      'request_id', v_request.id
    )
  );
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in to update notifications'
      using errcode = '42501';
  end if;

  update public.notifications
     set read_at = coalesce(read_at, now())
   where id = p_notification_id
     and user_id = auth.uid();

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Notification not found'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in to update notifications'
      using errcode = '42501';
  end if;

  update public.notifications
     set read_at = now()
   where user_id = auth.uid()
     and read_at is null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

drop trigger if exists join_requests_set_updated_at on public.join_requests;
create trigger join_requests_set_updated_at
  before update on public.join_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. Row-level security
-- ---------------------------------------------------------------------------

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.join_requests enable row level security;
alter table public.notifications enable row level security;

-- Groups are visible inside their department. Members keep access if their
-- department changes later, and moderators can inspect every group.
drop policy if exists "groups are readable in the same department" on public.groups;
create policy "groups are readable in the same department"
  on public.groups
  for select
  to authenticated
  using (
    public.is_moderator()
    or department_id = public.current_department_id()
    or public.is_group_member(id)
  );

-- Membership rows are used for member counts and the viewer's own role.
-- Display names come from list_profile_cards(), not from this table.
drop policy if exists "memberships are readable by department peers" on public.group_memberships;
create policy "memberships are readable by department peers"
  on public.group_memberships
  for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_moderator()
    or public.is_group_member(group_id)
    or public.group_in_my_department(group_id)
  );

-- Students see their own requests. Group admins see requests for their group.
drop policy if exists "join requests are readable by the student or group admin" on public.join_requests;
create policy "join requests are readable by the student or group admin"
  on public.join_requests
  for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_moderator()
    or public.is_group_admin(group_id)
  );

drop policy if exists "notifications are readable by their owner" on public.notifications;
create policy "notifications are readable by their owner"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies are created for these tables. Every write
-- goes through the validated SECURITY DEFINER RPCs above.

-- ---------------------------------------------------------------------------
-- 7. Privileges
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

revoke all on public.groups from anon, authenticated;
revoke all on public.group_memberships from anon, authenticated;
revoke all on public.join_requests from anon, authenticated;
revoke all on public.notifications from anon, authenticated;

grant select on public.groups to authenticated;
grant select on public.group_memberships to authenticated;
grant select on public.join_requests to authenticated;
grant select on public.notifications to authenticated;

revoke all on function public.is_group_admin(uuid, uuid) from public;
revoke all on function public.is_group_member(uuid, uuid) from public;
revoke all on function public.current_department_id() from public;
revoke all on function public.group_in_my_department(uuid) from public;
revoke all on function public.list_profile_cards() from public;
revoke all on function public.create_group(text, text, public.group_type, text, text, public.academic_level, integer) from public;
revoke all on function public.send_join_request(uuid, text) from public;
revoke all on function public.withdraw_join_request(uuid) from public;
revoke all on function public.decide_join_request(uuid, text, text) from public;
revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
revoke all on function public.set_updated_at() from public;

grant execute on function public.is_group_admin(uuid, uuid) to authenticated;
grant execute on function public.is_group_member(uuid, uuid) to authenticated;
grant execute on function public.current_department_id() to authenticated;
grant execute on function public.group_in_my_department(uuid) to authenticated;
grant execute on function public.list_profile_cards() to authenticated;
grant execute on function public.create_group(text, text, public.group_type, text, text, public.academic_level, integer) to authenticated;
grant execute on function public.send_join_request(uuid, text) to authenticated;
grant execute on function public.withdraw_join_request(uuid) to authenticated;
grant execute on function public.decide_join_request(uuid, text, text) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- ---------------------------------------------------------------------------
-- 8. Notes
-- ---------------------------------------------------------------------------
-- * Students must be email-verified and department-verified before creating or
--   joining. The checks are repeated in the database, not just in React.
-- * Only one PENDING request per student/group is allowed by a partial index.
-- * Group admins are memberships with role = 'ADMIN'. The creator gets one in
--   create_group(). A later phase can add transfer/remove-admin controls.
-- * Notifications are written by the RPCs. Clients can only mark their own
--   notifications as read.
-- * Posts, resources, rules, sessions and reports are intentionally out of
--   scope until Phase 4/5.
