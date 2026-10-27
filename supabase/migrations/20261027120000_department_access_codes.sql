-- Department access codes
--
-- A moderator generates one code per department and shares it with that class
-- (e.g. in the class WhatsApp group). A student who enters the correct code is
-- verified instantly, so moderators no longer approve people one at a time.
--
-- Codes live in their own table because `departments` is world-readable (the
-- sign-up dropdown needs it). A code column on `departments` would hand every
-- code to anyone who calls the public REST endpoint.

create table if not exists public.department_codes (
  department_id text primary key references public.departments (id) on delete cascade,
  code text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_codes_code_length check (char_length(code) between 4 and 32)
);

-- Case-insensitive uniqueness: "climate-4821" and "CLIMATE-4821" are the same code.
create unique index if not exists department_codes_code_uidx
  on public.department_codes (upper(code));

alter table public.department_codes enable row level security;

drop policy if exists "moderators read department codes" on public.department_codes;
create policy "moderators read department codes"
  on public.department_codes for select to authenticated
  using (public.is_moderator());

drop policy if exists "moderators insert department codes" on public.department_codes;
create policy "moderators insert department codes"
  on public.department_codes for insert to authenticated
  with check (public.is_moderator());

drop policy if exists "moderators update department codes" on public.department_codes;
create policy "moderators update department codes"
  on public.department_codes for update to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

drop policy if exists "moderators delete department codes" on public.department_codes;
create policy "moderators delete department codes"
  on public.department_codes for delete to authenticated
  using (public.is_moderator());

/**
 * Redeems a department access code for the signed-in student.
 *
 * Returns jsonb instead of raising for a wrong code so the UI can show a
 * friendly message without a failed request. The department is taken from the
 * code, not from the client, so a student cannot switch departments by editing
 * their profile and redeeming afterwards.
 */
create or replace function public.redeem_department_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_department_id text;
  v_department_name text;
  v_current_status public.verification_status;
begin
  if v_user_id is null then
    raise exception 'Sign in to redeem a department code'
      using errcode = '42501';
  end if;

  if p_code is null or char_length(trim(p_code)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty_code');
  end if;

  select dc.department_id, d.name
    into v_department_id, v_department_name
    from public.department_codes dc
    join public.departments d on d.id = dc.department_id
   where upper(dc.code) = upper(trim(p_code))
   limit 1;

  if v_department_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  select verification_status
    into v_current_status
    from public.profiles
   where id = v_user_id;

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  if v_current_status = 'VERIFIED'::public.verification_status then
    return jsonb_build_object(
      'ok', true,
      'department', v_department_name,
      'already_verified', true
    );
  end if;

  -- The profile guard blocks students from writing their own verification
  -- columns. This flag is the documented escape hatch for trusted RPCs.
  perform set_config('app.profile_system_update', 'on', true);

  update public.profiles
     set department_id = v_department_id,
         verification_status = 'VERIFIED'::public.verification_status,
         verified_at = now(),
         verified_by = null
   where id = v_user_id;

  perform set_config('app.profile_system_update', 'off', true);

  insert into public.verification_reviews (profile_id, reviewer_id, decision, note)
  values (v_user_id, null, 'VERIFIED', 'Verified with the department access code');

  return jsonb_build_object('ok', true, 'department', v_department_name);
end;
$$;

revoke all on function public.redeem_department_code(text) from public;
grant execute on function public.redeem_department_code(text) to authenticated;

-- Give every active department a first code so the pilot works immediately.
-- Moderators can rotate any code from the moderation screen.
insert into public.department_codes (department_id, code)
select d.id,
       upper(substr(regexp_replace(d.id, '[^a-zA-Z]', '', 'g'), 1, 4))
         || '-' || upper(substr(md5(random()::text || d.id), 1, 4))
  from public.departments d
 where d.is_active
on conflict (department_id) do nothing;
