-- Row Level Security for the costing module, plus transactional RPCs used by the app.
--
-- Access matrix:
--   owner, admin : read + write everything
--   produksi     : read everything; create/edit ingredients & recipes (no delete of
--                  ingredients/recipes, no pricing changes — see guard_recipe_pricing);
--                  bundles read-only
--   manager      : read-only
--   no role      : nothing

alter table public.ingredients enable row level security;
alter table public.ingredient_price_history enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_items enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;

revoke all on public.ingredients, public.ingredient_price_history, public.recipes,
  public.recipe_items, public.bundles, public.bundle_items from anon;

-- Price history is append-only through the trigger.
revoke insert, update, delete on public.ingredient_price_history from authenticated;

-- ingredients ---------------------------------------------------------------
create policy ingredients_select on public.ingredients
  for select to authenticated
  using ((select public.my_role()) is not null);

create policy ingredients_insert on public.ingredients
  for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));

create policy ingredients_update on public.ingredients
  for update to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi')))
  with check ((select public.has_role('owner', 'admin', 'produksi')));

create policy ingredients_delete on public.ingredients
  for delete to authenticated
  using ((select public.has_role('owner', 'admin')));

-- ingredient_price_history --------------------------------------------------
create policy ingredient_price_history_select on public.ingredient_price_history
  for select to authenticated
  using ((select public.my_role()) is not null);

-- recipes -------------------------------------------------------------------
create policy recipes_select on public.recipes
  for select to authenticated
  using ((select public.my_role()) is not null);

create policy recipes_insert on public.recipes
  for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));

create policy recipes_update on public.recipes
  for update to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi')))
  with check ((select public.has_role('owner', 'admin', 'produksi')));

create policy recipes_delete on public.recipes
  for delete to authenticated
  using ((select public.has_role('owner', 'admin')));

-- recipe_items (editing a recipe's composition includes removing lines) -----
create policy recipe_items_select on public.recipe_items
  for select to authenticated
  using ((select public.my_role()) is not null);

create policy recipe_items_insert on public.recipe_items
  for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));

create policy recipe_items_update on public.recipe_items
  for update to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi')))
  with check ((select public.has_role('owner', 'admin', 'produksi')));

create policy recipe_items_delete on public.recipe_items
  for delete to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi')));

-- bundles & bundle_items ----------------------------------------------------
create policy bundles_select on public.bundles
  for select to authenticated
  using ((select public.my_role()) is not null);

create policy bundles_write on public.bundles
  for all to authenticated
  using ((select public.has_role('owner', 'admin')))
  with check ((select public.has_role('owner', 'admin')));

create policy bundle_items_select on public.bundle_items
  for select to authenticated
  using ((select public.my_role()) is not null);

create policy bundle_items_write on public.bundle_items
  for all to authenticated
  using ((select public.has_role('owner', 'admin')))
  with check ((select public.has_role('owner', 'admin')));

-- ---------------------------------------------------------------------------
-- RPCs (SECURITY INVOKER: RLS and triggers still apply to the caller)
-- ---------------------------------------------------------------------------

-- Create or update a recipe and replace its items atomically.
-- Pricing fields are ignored for roles that may not set them.
create function public.save_recipe(p_id uuid, p_recipe jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_can_price boolean := coalesce(public.my_role() in ('owner', 'admin'), false);
begin
  if p_id is null then
    insert into public.recipes (
      name, category, yield_qty, yield_unit, waste_pct, target_hpp_pct,
      selling_price, is_active, notes
    ) values (
      btrim(p_recipe ->> 'name'),
      (p_recipe ->> 'category')::public.recipe_category,
      (p_recipe ->> 'yield_qty')::numeric,
      (p_recipe ->> 'yield_unit')::public.yield_unit,
      coalesce((p_recipe ->> 'waste_pct')::numeric, 0),
      case when v_can_price then coalesce((p_recipe ->> 'target_hpp_pct')::numeric, 35) else 35 end,
      case when v_can_price then (p_recipe ->> 'selling_price')::bigint end,
      coalesce((p_recipe ->> 'is_active')::boolean, true),
      nullif(btrim(p_recipe ->> 'notes'), '')
    )
    returning id into v_id;
  else
    update public.recipes r set
      name = btrim(p_recipe ->> 'name'),
      category = (p_recipe ->> 'category')::public.recipe_category,
      yield_qty = (p_recipe ->> 'yield_qty')::numeric,
      yield_unit = (p_recipe ->> 'yield_unit')::public.yield_unit,
      waste_pct = coalesce((p_recipe ->> 'waste_pct')::numeric, 0),
      target_hpp_pct = case when v_can_price
        then coalesce((p_recipe ->> 'target_hpp_pct')::numeric, 35) else r.target_hpp_pct end,
      selling_price = case when v_can_price
        then (p_recipe ->> 'selling_price')::bigint else r.selling_price end,
      is_active = coalesce((p_recipe ->> 'is_active')::boolean, true),
      notes = nullif(btrim(p_recipe ->> 'notes'), '')
    where r.id = p_id
    returning r.id into v_id;

    if v_id is null then
      raise exception 'Resep tidak ditemukan atau Anda tidak punya akses' using errcode = 'insufficient_privilege';
    end if;

    delete from public.recipe_items where recipe_id = v_id;
  end if;

  insert into public.recipe_items (recipe_id, ingredient_id, sub_recipe_id, quantity, unit, sort_order)
  select
    v_id,
    nullif(e ->> 'ingredient_id', '')::uuid,
    nullif(e ->> 'sub_recipe_id', '')::uuid,
    (e ->> 'quantity')::numeric,
    (e ->> 'unit')::public.item_unit,
    (t.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(e, ord);

  return v_id;
end;
$$;

-- Copy a recipe and its items. Returns the new recipe id.
create function public.duplicate_recipe(p_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_can_price boolean := coalesce(public.my_role() in ('owner', 'admin'), false);
begin
  insert into public.recipes (
    name, category, yield_qty, yield_unit, waste_pct, target_hpp_pct,
    selling_price, is_active, notes
  )
  select
    r.name || ' (salinan)', r.category, r.yield_qty, r.yield_unit, r.waste_pct,
    case when v_can_price then r.target_hpp_pct else 35 end,
    case when v_can_price then r.selling_price end,
    r.is_active, r.notes
  from public.recipes r
  where r.id = p_id
  returning id into v_id;

  if v_id is null then
    raise exception 'Resep tidak ditemukan' using errcode = 'no_data_found';
  end if;

  insert into public.recipe_items (recipe_id, ingredient_id, sub_recipe_id, quantity, unit, sort_order)
  select v_id, ri.ingredient_id, ri.sub_recipe_id, ri.quantity, ri.unit, ri.sort_order
  from public.recipe_items ri
  where ri.recipe_id = p_id;

  return v_id;
end;
$$;

-- Create or update a bundle and replace its items atomically.
create function public.save_bundle(p_id uuid, p_bundle jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.bundles (name, selling_price, target_hpp_pct, is_active, notes)
    values (
      btrim(p_bundle ->> 'name'),
      (p_bundle ->> 'selling_price')::bigint,
      coalesce((p_bundle ->> 'target_hpp_pct')::numeric, 35),
      coalesce((p_bundle ->> 'is_active')::boolean, true),
      nullif(btrim(p_bundle ->> 'notes'), '')
    )
    returning id into v_id;
  else
    update public.bundles b set
      name = btrim(p_bundle ->> 'name'),
      selling_price = (p_bundle ->> 'selling_price')::bigint,
      target_hpp_pct = coalesce((p_bundle ->> 'target_hpp_pct')::numeric, 35),
      is_active = coalesce((p_bundle ->> 'is_active')::boolean, true),
      notes = nullif(btrim(p_bundle ->> 'notes'), '')
    where b.id = p_id
    returning b.id into v_id;

    if v_id is null then
      raise exception 'Paket tidak ditemukan atau Anda tidak punya akses' using errcode = 'insufficient_privilege';
    end if;

    delete from public.bundle_items where bundle_id = v_id;
  end if;

  insert into public.bundle_items (bundle_id, recipe_id, ingredient_id, quantity, unit, sort_order)
  select
    v_id,
    nullif(e ->> 'recipe_id', '')::uuid,
    nullif(e ->> 'ingredient_id', '')::uuid,
    (e ->> 'quantity')::numeric,
    (e ->> 'unit')::public.item_unit,
    (t.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(e, ord);

  return v_id;
end;
$$;

revoke execute on function public.save_recipe(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.duplicate_recipe(uuid) from public, anon;
revoke execute on function public.save_bundle(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.duplicate_recipe(uuid) to authenticated;
grant execute on function public.save_bundle(uuid, jsonb, jsonb) to authenticated;
