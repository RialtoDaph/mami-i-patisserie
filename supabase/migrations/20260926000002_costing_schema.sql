-- Recipe costing schema: ingredients, price history, recipes (with sub-recipes), bundles.
-- Money is stored as whole Rupiah (bigint). Quantities are numeric.
-- Percentages are stored as percent numbers (35 = 35%).

create type public.ingredient_category as enum ('bahan', 'kemasan');
create type public.purchase_unit as enum ('kg', 'liter', 'pcs', 'pack');
create type public.base_unit as enum ('g', 'ml', 'pcs');
create type public.recipe_category as enum ('mamis', 'pastry_supplier', 'minuman', 'sub_resep');
create type public.yield_unit as enum ('pcs', 'porsi', 'g', 'ml');
create type public.item_unit as enum ('g', 'kg', 'ml', 'liter', 'pcs', 'porsi');

-- ---------------------------------------------------------------------------
-- Unit helpers (must stay in sync with src/lib/costing/units.ts)
-- ---------------------------------------------------------------------------

-- How many base units one purchase unit holds. For 'pack', purchase_qty is
-- already expressed in base units (e.g. "pack isi 100 pcs", "pack 227 g").
create function public.purchase_unit_factor(u public.purchase_unit)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case u when 'kg' then 1000 when 'liter' then 1000 else 1 end::numeric;
$$;

-- Unit family used to check that a recipe item unit matches what it refers to.
create function public.unit_family(u text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case u
    when 'g' then 'mass' when 'kg' then 'mass'
    when 'ml' then 'volume' when 'liter' then 'volume'
    when 'pcs' then 'count'
    when 'porsi' then 'portion'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Ingredients & packaging
-- ---------------------------------------------------------------------------

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  category public.ingredient_category not null default 'bahan',
  supplier text,
  purchase_unit public.purchase_unit not null,
  purchase_qty numeric(12, 3) not null check (purchase_qty > 0),
  purchase_price bigint not null check (purchase_price >= 0),
  base_unit public.base_unit not null,
  price_per_base_unit numeric generated always as (
    purchase_price / (purchase_qty * public.purchase_unit_factor(purchase_unit))
  ) stored,
  notes text,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_unit_match check (
    (purchase_unit = 'kg' and base_unit = 'g')
    or (purchase_unit = 'liter' and base_unit = 'ml')
    or (purchase_unit = 'pcs' and base_unit = 'pcs')
    or purchase_unit = 'pack'
  )
);

comment on column public.ingredients.purchase_qty is
  'Amount per purchase: in purchase units for kg/liter/pcs, in base units for pack.';

create index ingredients_name_idx on public.ingredients (lower(name));

create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Price history (written only by trigger)
-- ---------------------------------------------------------------------------

create table public.ingredient_price_history (
  id bigint generated always as identity primary key,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  old_purchase_price bigint,
  new_purchase_price bigint not null,
  old_purchase_qty numeric(12, 3),
  new_purchase_qty numeric(12, 3) not null,
  old_price_per_base_unit numeric,
  new_price_per_base_unit numeric not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index ingredient_price_history_ingredient_idx
  on public.ingredient_price_history (ingredient_id, changed_at desc);

create function public.log_ingredient_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.price_per_base_unit is distinct from old.price_per_base_unit
     or new.purchase_price is distinct from old.purchase_price
     or new.purchase_qty is distinct from old.purchase_qty then
    insert into public.ingredient_price_history (
      ingredient_id,
      old_purchase_price, new_purchase_price,
      old_purchase_qty, new_purchase_qty,
      old_price_per_base_unit, new_price_per_base_unit,
      changed_by
    ) values (
      new.id,
      case when tg_op = 'UPDATE' then old.purchase_price end, new.purchase_price,
      case when tg_op = 'UPDATE' then old.purchase_qty end, new.purchase_qty,
      case when tg_op = 'UPDATE' then old.price_per_base_unit end, new.price_per_base_unit,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

revoke execute on function public.log_ingredient_price() from public, anon, authenticated;

create trigger ingredients_log_price
  after insert or update on public.ingredients
  for each row execute function public.log_ingredient_price();

-- ---------------------------------------------------------------------------
-- Recipes
-- ---------------------------------------------------------------------------

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  category public.recipe_category not null default 'mamis',
  yield_qty numeric(12, 3) not null check (yield_qty > 0),
  yield_unit public.yield_unit not null default 'pcs',
  waste_pct numeric(5, 2) not null default 0 check (waste_pct >= 0 and waste_pct < 100),
  target_hpp_pct numeric(5, 2) not null default 35 check (target_hpp_pct > 0 and target_hpp_pct <= 100),
  selling_price bigint check (selling_price >= 0),
  is_active boolean not null default true,
  notes text,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.recipes.selling_price is 'Per yield unit, excluding PBJT. Null for sub-recipes.';

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid references public.ingredients (id) on delete restrict,
  sub_recipe_id uuid references public.recipes (id) on delete restrict,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit public.item_unit not null,
  sort_order integer not null default 0,
  constraint recipe_items_one_source check ((ingredient_id is null) <> (sub_recipe_id is null)),
  constraint recipe_items_not_self check (sub_recipe_id is distinct from recipe_id)
);

create index recipe_items_recipe_idx on public.recipe_items (recipe_id, sort_order);
create index recipe_items_ingredient_idx on public.recipe_items (ingredient_id);
create index recipe_items_sub_recipe_idx on public.recipe_items (sub_recipe_id);

-- Validates unit family and prevents circular sub-recipe references.
create function public.check_recipe_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_unit text;
  creates_cycle boolean;
begin
  if new.ingredient_id is not null then
    select i.base_unit::text into target_unit from public.ingredients i where i.id = new.ingredient_id;
  else
    select r.yield_unit::text into target_unit from public.recipes r where r.id = new.sub_recipe_id;
  end if;

  if target_unit is not null
     and public.unit_family(new.unit::text) is distinct from public.unit_family(target_unit) then
    raise exception 'Satuan % tidak cocok dengan satuan dasar %', new.unit, target_unit
      using errcode = 'check_violation';
  end if;

  if new.sub_recipe_id is not null then
    -- Serialize graph changes so two concurrent edits cannot form a cycle together.
    perform pg_advisory_xact_lock(hashtext('public.recipe_items.graph'));

    -- Walk down from the sub-recipe; reaching the parent means a cycle.
    with recursive descendants(id) as (
      select new.sub_recipe_id
      union
      select ri.sub_recipe_id
      from public.recipe_items ri
      join descendants d on ri.recipe_id = d.id
      where ri.sub_recipe_id is not null
        and ri.id is distinct from new.id
    )
    select exists (select 1 from descendants where id = new.recipe_id) into creates_cycle;

    if creates_cycle then
      raise exception 'Referensi melingkar: resep ini sudah dipakai di dalam sub-resep tersebut'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

create trigger recipe_items_check
  before insert or update on public.recipe_items
  for each row execute function public.check_recipe_item();

-- ---------------------------------------------------------------------------
-- Bundles (Blessings Box, hampers)
-- ---------------------------------------------------------------------------

create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  selling_price bigint check (selling_price >= 0),
  target_hpp_pct numeric(5, 2) not null default 35 check (target_hpp_pct > 0 and target_hpp_pct <= 100),
  is_active boolean not null default true,
  notes text,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.bundles.selling_price is 'Per bundle, excluding PBJT.';

create trigger bundles_set_updated_at
  before update on public.bundles
  for each row execute function public.set_updated_at();

create table public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  recipe_id uuid references public.recipes (id) on delete restrict,
  ingredient_id uuid references public.ingredients (id) on delete restrict,
  quantity numeric(12, 3) not null check (quantity > 0),
  unit public.item_unit not null,
  sort_order integer not null default 0,
  constraint bundle_items_one_source check ((recipe_id is null) <> (ingredient_id is null))
);

create index bundle_items_bundle_idx on public.bundle_items (bundle_id, sort_order);
create index bundle_items_recipe_idx on public.bundle_items (recipe_id);
create index bundle_items_ingredient_idx on public.bundle_items (ingredient_id);

create function public.check_bundle_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_unit text;
begin
  if new.ingredient_id is not null then
    select i.base_unit::text into target_unit from public.ingredients i where i.id = new.ingredient_id;
  else
    select r.yield_unit::text into target_unit from public.recipes r where r.id = new.recipe_id;
  end if;

  if target_unit is not null
     and public.unit_family(new.unit::text) is distinct from public.unit_family(target_unit) then
    raise exception 'Satuan % tidak cocok dengan satuan dasar %', new.unit, target_unit
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger bundle_items_check
  before insert or update on public.bundle_items
  for each row execute function public.check_bundle_item();

-- ---------------------------------------------------------------------------
-- Keep existing items valid when a referenced unit changes
-- ---------------------------------------------------------------------------

create function public.guard_ingredient_base_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.unit_family(new.base_unit::text) is distinct from public.unit_family(old.base_unit::text)
     and (exists (select 1 from public.recipe_items where ingredient_id = new.id)
          or exists (select 1 from public.bundle_items where ingredient_id = new.id)) then
    raise exception 'Satuan dasar tidak bisa diganti karena bahan ini sudah dipakai di resep/paket'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger ingredients_guard_base_unit
  before update of base_unit on public.ingredients
  for each row execute function public.guard_ingredient_base_unit();

create function public.guard_recipe_yield_unit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.unit_family(new.yield_unit::text) is distinct from public.unit_family(old.yield_unit::text)
     and (exists (select 1 from public.recipe_items where sub_recipe_id = new.id)
          or exists (select 1 from public.bundle_items where recipe_id = new.id)) then
    raise exception 'Satuan hasil tidak bisa diganti karena resep ini sudah dipakai di resep/paket lain'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger recipes_guard_yield_unit
  before update of yield_unit on public.recipes
  for each row execute function public.guard_recipe_yield_unit();

-- ---------------------------------------------------------------------------
-- Role 'produksi' may not set selling price or target HPP on recipes.
-- (Applies only to API users; auth.uid() is null for SQL editor / migrations.)
-- ---------------------------------------------------------------------------

create function public.guard_recipe_pricing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.my_role() = 'produksi' then
    if tg_op = 'INSERT' and (new.selling_price is not null or new.target_hpp_pct <> 35) then
      raise exception 'Role produksi tidak boleh mengisi harga jual atau target HPP'
        using errcode = 'insufficient_privilege';
    end if;
    if tg_op = 'UPDATE' and (new.selling_price is distinct from old.selling_price
                             or new.target_hpp_pct is distinct from old.target_hpp_pct) then
      raise exception 'Role produksi tidak boleh mengubah harga jual atau target HPP'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;

create trigger recipes_guard_pricing
  before insert or update on public.recipes
  for each row execute function public.guard_recipe_pricing();
