-- Stage 5a: team login with a PIN on registered devices, profile details, crew access.
--
-- Roles (KEPUTUSAN + prototype, decided by Alto 2026-10-24):
--   owner    Alto: everything, plus Alto-only powers (team accounts, targets, approval limits, payroll paid).
--   admin    Nana and Mami: all tabs, without the Alto-only powers.
--   produksi Pastry chef: beranda, order, produksi, tim, alat. May only move an order to diproduksi / siap.
--   manager  Cafe manager: kafe, mingguan, target, tim, persetujuan, alat. Read-only on order/costing data.
--   crew     Barista, waiter, part-timer: tim and alat only. No access to orders, customers or costing.
-- Login: Alto registers a device once (email + password). On that device people pick their name and type a
-- 4-digit PIN; the server then opens a normal Supabase session for them. PIN hashes and device tokens are only
-- reachable through the service_role functions below, never through the API as a user.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column title text not null default '' check (length(title) <= 40),
  add column is_active boolean not null default true,
  add column sort_order integer not null default 0;

comment on column public.profiles.title is 'Shown under the name on the login screen, e.g. "Owner", "Manager kafe", "Barista".';
comment on column public.profiles.is_active is 'false = no access and hidden from the login screen.';

-- Inactive people lose access right away.
create or replace function public.my_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active;
$$;

-- Business data (orders, customers, costing, settings) is for the office roles; crew sees none of it.
create function public.is_office()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.my_role() in ('owner', 'admin', 'produksi', 'manager'), false);
$$;

revoke execute on function public.is_office() from public, anon;
grant execute on function public.is_office() to authenticated;

drop policy ingredients_select on public.ingredients;
drop policy ingredient_price_history_select on public.ingredient_price_history;
drop policy recipes_select on public.recipes;
drop policy recipe_items_select on public.recipe_items;
drop policy bundles_select on public.bundles;
drop policy bundle_items_select on public.bundle_items;
drop policy settings_select on public.settings;
drop policy products_select on public.products;
drop policy campaigns_select on public.campaigns;
drop policy campaign_products_select on public.campaign_products;
drop policy customers_select on public.customers;
drop policy orders_select on public.orders;
drop policy order_items_select on public.order_items;
drop policy payments_select on public.payments;
drop policy shipping_areas_select on public.shipping_areas;
drop policy payment_proofs_select on storage.objects;

create policy ingredients_select on public.ingredients for select to authenticated using ((select public.is_office()));
create policy ingredient_price_history_select on public.ingredient_price_history for select to authenticated using ((select public.is_office()));
create policy recipes_select on public.recipes for select to authenticated using ((select public.is_office()));
create policy recipe_items_select on public.recipe_items for select to authenticated using ((select public.is_office()));
create policy bundles_select on public.bundles for select to authenticated using ((select public.is_office()));
create policy bundle_items_select on public.bundle_items for select to authenticated using ((select public.is_office()));
create policy settings_select on public.settings for select to authenticated using ((select public.is_office()));
create policy products_select on public.products for select to authenticated using ((select public.is_office()));
create policy campaigns_select on public.campaigns for select to authenticated using ((select public.is_office()));
create policy campaign_products_select on public.campaign_products for select to authenticated using ((select public.is_office()));
create policy customers_select on public.customers for select to authenticated using ((select public.is_office()));
create policy orders_select on public.orders for select to authenticated using ((select public.is_office()));
create policy order_items_select on public.order_items for select to authenticated using ((select public.is_office()));
create policy payments_select on public.payments for select to authenticated using ((select public.is_office()));
create policy shipping_areas_select on public.shipping_areas for select to authenticated using ((select public.is_office()));
create policy payment_proofs_select on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select public.is_office()));

-- ---------------------------------------------------------------------------
-- Pastry chef (produksi) may only move an order to diproduksi or siap
-- ---------------------------------------------------------------------------

create function public.orders_status_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Direct edits only: status changes made by other triggers (e.g. a matched payment) are not the user's choice.
  if pg_trigger_depth() = 1
     and new.status is distinct from old.status
     and public.my_role() = 'produksi'
     and new.status not in ('diproduksi', 'siap') then
    raise exception 'Produksi hanya bisa mengubah status ke Diproduksi atau Siap' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger orders_status_guard
  before update of status on public.orders
  for each row execute function public.orders_status_guard();

-- ---------------------------------------------------------------------------
-- PINs and devices (service_role only)
-- ---------------------------------------------------------------------------

create table public.profile_pins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  pin_hash text not null,
  failed_count integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.profile_pins is 'bcrypt hash of each person''s 4-digit PIN. No API access; only the service_role functions read it.';

alter table public.profile_pins enable row level security;
revoke all on public.profile_pins from anon, authenticated;

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 60),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

comment on table public.devices is 'Devices where the PIN login is allowed. token_hash = sha256 of the secret kept in an httpOnly cookie.';

alter table public.devices enable row level security;
revoke all on public.devices from anon;
create policy devices_owner_select on public.devices for select to authenticated using ((select public.has_role('owner')));
create policy devices_owner_insert on public.devices for insert to authenticated
  with check ((select public.has_role('owner')) and created_by = (select auth.uid()));
create policy devices_owner_update on public.devices for update to authenticated
  using ((select public.has_role('owner'))) with check ((select public.has_role('owner')));

-- People shown on a registered device's login screen. Empty when the device is unknown or revoked.
create function public.pin_people(p_device_hash text)
returns table (id uuid, full_name text, title text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.title
  from public.profiles p
  join public.profile_pins pp on pp.user_id = p.id
  where p.is_active and p.role is not null
    and exists (select 1 from public.devices d where d.token_hash = p_device_hash and d.revoked_at is null)
  order by p.sort_order, p.full_name;
$$;

-- Checks a PIN typed on a registered device. 5 wrong tries lock the person for 15 minutes.
-- Returns 'ok', 'salah', 'terkunci' or 'perangkat'.
create function public.pin_check(p_device_hash text, p_user uuid, p_pin text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_device uuid;
  v_pin public.profile_pins;
begin
  select id into v_device from public.devices where token_hash = p_device_hash and revoked_at is null;
  if v_device is null then
    return 'perangkat';
  end if;

  select pp.* into v_pin
  from public.profile_pins pp join public.profiles p on p.id = pp.user_id
  where pp.user_id = p_user and p.is_active and p.role is not null
  for update of pp;
  if v_pin.user_id is null then
    return 'salah';
  end if;
  if v_pin.locked_until > now() then
    return 'terkunci';
  end if;

  if p_pin ~ '^[0-9]{4}$' and extensions.crypt(p_pin, v_pin.pin_hash) = v_pin.pin_hash then
    update public.profile_pins set failed_count = 0, locked_until = null where user_id = p_user;
    update public.devices set last_used_at = now() where id = v_device;
    return 'ok';
  end if;

  update public.profile_pins
  set failed_count = case when failed_count + 1 >= 5 then 0 else failed_count + 1 end,
      locked_until = case when failed_count + 1 >= 5 then now() + interval '15 minutes' else null end
  where user_id = p_user;
  return case when v_pin.failed_count + 1 >= 5 then 'terkunci' else 'salah' end;
end;
$$;

-- Owner sets (or clears, with null) a person's PIN from Akun tim.
create function public.set_pin(p_user uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_role('owner') then
    raise exception 'Hanya Alto yang bisa mengatur PIN' using errcode = 'insufficient_privilege';
  end if;
  if p_pin is null then
    delete from public.profile_pins where user_id = p_user;
    return;
  end if;
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN harus 4 angka' using errcode = 'check_violation';
  end if;
  insert into public.profile_pins (user_id, pin_hash)
  values (p_user, extensions.crypt(p_pin, extensions.gen_salt('bf', 8)))
  on conflict (user_id) do update
    set pin_hash = excluded.pin_hash, failed_count = 0, locked_until = null, updated_at = now();
end;
$$;

-- Which people already have a PIN (for Akun tim), without exposing the hashes.
create function public.pin_status()
returns table (user_id uuid, locked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select pp.user_id, coalesce(pp.locked_until > now(), false)
  from public.profile_pins pp
  where public.has_role('owner');
$$;

revoke execute on function public.pin_people(text) from public, anon, authenticated;
revoke execute on function public.pin_check(text, uuid, text) from public, anon, authenticated;
grant execute on function public.pin_people(text) to service_role;
grant execute on function public.pin_check(text, uuid, text) to service_role;
revoke execute on function public.set_pin(uuid, text) from public, anon;
revoke execute on function public.pin_status() from public, anon;
grant execute on function public.set_pin(uuid, text) to authenticated;
grant execute on function public.pin_status() to authenticated;
revoke execute on function public.orders_status_guard() from public, anon, authenticated;

-- Display order of the founders on the login screen.
update public.profiles set title = 'Owner', sort_order = 1 where role = 'owner' and title = '';
