-- Group discussions (posts)
--
-- Members can post in their groups. Admins can delete any post; authors can delete their own.

create table if not exists public.group_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint group_posts_content_length check (char_length(content) between 1 and 2000)
);

create index if not exists group_posts_group_created_idx on public.group_posts (group_id, created_at desc);
create index if not exists group_posts_author_idx on public.group_posts (author_id);

alter table public.group_posts enable row level security;

drop policy if exists "members read group posts" on public.group_posts;
create policy "members read group posts"
  on public.group_posts for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "members create posts" on public.group_posts;
create policy "members create posts"
  on public.group_posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_group_member(group_id)
  );

drop policy if exists "authors or admins delete posts" on public.group_posts;
create policy "authors or admins delete posts"
  on public.group_posts for delete to authenticated
  using (
    author_id = auth.uid()
    or public.is_group_admin(group_id)
  );

-- Ensure updated_at is set on updates
create or replace function public.set_group_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists group_posts_set_updated_at on public.group_posts;
create trigger group_posts_set_updated_at
  before update on public.group_posts
  for each row execute function public.set_group_posts_updated_at();

grant select, insert, delete on public.group_posts to authenticated;
