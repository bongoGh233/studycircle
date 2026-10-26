-- Restrict discovery and peer directory data to approved, email-verified students.
-- The approval evidence/process remains a product/operations decision; no email
-- domain is encoded here. A moderator's verified decision is the access gate.

create or replace function public.is_verified_student()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.email_verified is true
      and p.verification_status = 'VERIFIED'::public.verification_status
      and p.department_id is not null
  );
$$;

-- A user-selected department is not sufficient to browse student groups.
create or replace function public.current_department_id()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.department_id
  from public.profiles p
  where p.id = auth.uid()
    and p.email_verified is true
    and p.verification_status = 'VERIFIED'::public.verification_status
    and p.department_id is not null;
$$;

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
  select p.id, p.display_name, p.department_id, p.programme, p.academic_level
  from public.profiles p
  where auth.uid() = p.id
     or public.is_moderator()
     or (
       public.is_verified_student()
       and (
         exists (
           select 1
           from public.group_memberships mine
           join public.group_memberships theirs on theirs.group_id = mine.group_id
           where mine.student_id = auth.uid()
             and mine.status = 'ACTIVE'
             and theirs.student_id = p.id
             and theirs.status = 'ACTIVE'
         )
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
         or exists (
           select 1
           from public.group_memberships gm
           join public.groups g on g.id = gm.group_id
           where gm.student_id = p.id
             and gm.status = 'ACTIVE'
             and gm.role = 'ADMIN'
             and g.department_id = public.current_department_id()
         )
       )
     );
$$;

-- Apply the student gate at the database boundary, not just in the UI.
drop policy if exists "groups are readable in the same department" on public.groups;
create policy "groups are readable in the same department"
  on public.groups for select to authenticated
  using (
    public.is_moderator()
    or (
      public.is_verified_student()
      and (department_id = public.current_department_id() or public.is_group_member(id))
    )
  );

drop policy if exists "memberships are readable by department peers" on public.group_memberships;
create policy "memberships are readable by department peers"
  on public.group_memberships for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_moderator()
    or (
      public.is_verified_student()
      and (public.is_group_member(group_id) or public.group_in_my_department(group_id))
    )
  );

revoke all on function public.is_verified_student() from public;
revoke all on function public.current_department_id() from public;
revoke all on function public.list_profile_cards() from public;
grant execute on function public.is_verified_student() to authenticated;
grant execute on function public.current_department_id() to authenticated;
grant execute on function public.list_profile_cards() to authenticated;
