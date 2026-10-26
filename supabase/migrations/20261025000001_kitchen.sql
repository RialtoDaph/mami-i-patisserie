-- Stage 5b: kitchen stock (manual count + minimum), waste log, "Selesai dibuat" marks.
--
-- Majoo stays the POS: there is no stock in/out ledger. Stock is what the kitchen counted last, in the
-- ingredient's base unit (g, ml, pcs). The shopping list subtracts it; Beranda flags items under the minimum
-- (the minimum is set by the kitchen, KEPUTUSAN ronde 3).

-- ---------------------------------------------------------------------------
-- Ingredient stock
-- ---------------------------------------------------------------------------

alter table public.ingredients
  add column stock_qty numeric(14, 3) check (stock_qty >= 0),
  add column stock_counted_at timestamptz,
  add column min_stock numeric(14, 3) check (min_stock >= 0);

comment on column public.ingredients.stock_qty is 'Last manual count in the base unit. Null = never counted.';
comment on column public.ingredients.min_stock is 'Warn when stock_qty is below this (base unit). Null = no minimum.';

-- ---------------------------------------------------------------------------
-- Production marks: the pastry chef ticks a product as made for a day
-- ---------------------------------------------------------------------------

create table public.production_marks (
  production_date date not null,
  product_id uuid not null references public.products (id) on delete cascade,
  done_by uuid references auth.users (id) on delete set null default auth.uid(),
  done_at timestamptz not null default now(),
  primary key (production_date, product_id)
);

comment on table public.production_marks is '"Selesai dibuat" ticks on Beranda (production date = fulfill date).';

alter table public.production_marks enable row level security;
revoke all on public.production_marks from anon;
create policy production_marks_select on public.production_marks for select to authenticated using ((select public.is_office()));
create policy production_marks_insert on public.production_marks for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy production_marks_delete on public.production_marks for delete to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi')));

-- ---------------------------------------------------------------------------
-- Waste log: unsold/failed products or spoiled ingredients
-- ---------------------------------------------------------------------------

create table public.waste_logs (
  id uuid primary key default gen_random_uuid(),
  waste_date date not null default public.today_jakarta(),
  product_id uuid references public.products (id) on delete cascade,
  ingredient_id uuid references public.ingredients (id) on delete cascade,
  qty numeric(14, 3) not null check (qty > 0),
  reason text not null check (reason in ('tidak_laku', 'gagal', 'rusak', 'kadaluarsa', 'lain')),
  note text check (length(note) <= 300),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  constraint waste_one_item check ((product_id is null) <> (ingredient_id is null))
);

comment on table public.waste_logs is 'Products: qty in product units. Ingredients: qty in the base unit.';

create index waste_logs_date_idx on public.waste_logs (waste_date desc);

alter table public.waste_logs enable row level security;
revoke all on public.waste_logs from anon;
create policy waste_logs_select on public.waste_logs for select to authenticated using ((select public.is_office()));
create policy waste_logs_insert on public.waste_logs for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')) and created_by = (select auth.uid()));
create policy waste_logs_delete on public.waste_logs for delete to authenticated
  using ((select public.has_role('owner', 'admin')) or (created_by = (select auth.uid()) and waste_date = public.today_jakarta()));
