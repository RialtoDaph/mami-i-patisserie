-- Roles and user profiles.
-- Every authenticated user gets a profile row. A profile without a role has no
-- access to any data until the owner assigns one (least privilege by default).

create type public.app_role as enum ('owner', 'admin', 'produksi', 'manager');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per login. role = null means no access yet.';

-- Generic updated_at maintenance, reused by other tables.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role of the calling user. SECURITY DEFINER so it can read profiles without
-- recursing through the profiles RLS policies.
create function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

create function public.has_role(variadic roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() = any (roles), false);
$$;

revoke execute on function public.my_role() from public, anon;
revoke execute on function public.has_role(public.app_role[]) from public, anon;
grant execute on function public.my_role() to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;

-- Create a profile automatically when a user is created in Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
revoke all on public.profiles from anon;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.has_role('owner', 'admin')));

-- Only the owner can change names/roles. Profiles are inserted by the trigger
-- above and deleted via cascade from auth.users, so no insert/delete policies.
create policy profiles_update_owner on public.profiles
  for update to authenticated
  using ((select public.has_role('owner')))
  with check ((select public.has_role('owner')));
