-- Preorder module: products, campaigns, customers, orders, payments, settings.
-- Money is whole Rupiah (bigint). Dates for fulfillment are plain dates (Asia/Jakarta).
-- Weekly capacity uses ISO weeks (Monday–Sunday) of the fulfill date.
-- Keep logic in sync with src/lib/preorder/*.

create type public.fulfill_method as enum ('ambil', 'kirim_instan', 'ekspedisi');
create type public.order_status as enum (
  'baru', 'menunggu_dp', 'dp_diterima', 'diproduksi', 'siap', 'dikirim', 'selesai', 'batal'
);
create type public.payment_method as enum ('transfer', 'qris', 'tunai');

-- Today's date in Bandung, used for lead time and campaign windows.
create function public.today_jakarta()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Jakarta')::date;
$$;

-- ---------------------------------------------------------------------------
-- Settings (single row)
-- ---------------------------------------------------------------------------

create table public.settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Mami I Pâtisserie',
  business_whatsapp text,
  bank_name text,
  bank_account_no text,
  bank_account_name text,
  qris_note text,
  pickup_address text,
  default_dp_percent numeric(5, 2) not null default 50 check (default_dp_percent >= 0 and default_dp_percent <= 100),
  updated_at timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Products (sellable items, linked to costing)
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  description text,
  recipe_id uuid references public.recipes (id) on delete restrict,
  bundle_id uuid references public.bundles (id) on delete restrict,
  units_per_product numeric(12, 3) not null default 1 check (units_per_product > 0),
  price bigint not null check (price >= 0),
  show_on_website boolean not null default false,
  preorder_enabled boolean not null default true,
  weekly_capacity integer check (weekly_capacity > 0),
  min_lead_days integer not null default 2 check (min_lead_days >= 0),
  photo_path text,
  is_active boolean not null default true,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_one_source check ((recipe_id is null) <> (bundle_id is null))
);

comment on column public.products.units_per_product is
  'Recipe yield units per product (e.g. 10 for "risol isi 10"). Usually 1 for bundles.';
comment on column public.products.weekly_capacity is 'Max quantity per Mon–Sun week of fulfill date. Null = unlimited.';

create index products_recipe_idx on public.products (recipe_id);
create index products_bundle_idx on public.products (bundle_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  preorder_open date not null,
  preorder_close date not null,
  fulfill_start date,
  fulfill_end date,
  dp_percent numeric(5, 2) check (dp_percent >= 0 and dp_percent <= 100),
  is_active boolean not null default true,
  notes text,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_preorder_range check (preorder_close >= preorder_open),
  constraint campaigns_fulfill_range check (fulfill_end is null or fulfill_start is null or fulfill_end >= fulfill_start)
);

comment on column public.campaigns.dp_percent is 'Null = use settings.default_dp_percent.';

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.campaign_products (
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  price_override bigint check (price_override >= 0),
  primary key (campaign_id, product_id)
);

create index campaign_products_product_idx on public.campaign_products (product_id);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  -- Normalized to international format without "+", e.g. 6281234567890.
  whatsapp text not null unique check (whatsapp ~ '^62[0-9]{7,13}$'),
  address text,
  notes text,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create sequence public.order_no_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default ('MIP-' || lpad(nextval('public.order_no_seq')::text, 4, '0')),
  customer_id uuid not null references public.customers (id) on delete restrict,
  campaign_id uuid references public.campaigns (id) on delete restrict,
  fulfill_date date not null,
  fulfill_method public.fulfill_method not null default 'ambil',
  delivery_address text,
  status public.order_status not null default 'baru',
  -- Maintained by triggers from order_items / payments.
  subtotal bigint not null default 0,
  amount_paid bigint not null default 0,
  shipping_fee bigint not null default 0 check (shipping_fee >= 0),
  discount bigint not null default 0 check (discount >= 0),
  total bigint generated always as (subtotal + shipping_fee - discount) stored,
  dp_amount bigint not null default 0 check (dp_amount >= 0),
  notes text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_fulfill_date_idx on public.orders (fulfill_date);
create index orders_customer_idx on public.orders (customer_id);
create index orders_campaign_idx on public.orders (campaign_id);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price bigint not null check (unit_price >= 0),
  sort_order integer not null default 0
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount bigint not null check (amount > 0),
  method public.payment_method not null,
  proof_path text,
  paid_at timestamptz not null default now(),
  note text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);

-- ---------------------------------------------------------------------------
-- Derived order fields
-- ---------------------------------------------------------------------------

create function public.refresh_order_subtotal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o
  set subtotal = coalesce((select sum(i.qty * i.unit_price) from public.order_items i where i.order_id = v_order), 0)
  where o.id = v_order;
  if tg_op = 'UPDATE' and new.order_id is distinct from old.order_id then
    update public.orders o
    set subtotal = coalesce((select sum(i.qty * i.unit_price) from public.order_items i where i.order_id = old.order_id), 0)
    where o.id = old.order_id;
  end if;
  return null;
end;
$$;

create trigger order_items_refresh_subtotal
  after insert or update or delete on public.order_items
  for each row execute function public.refresh_order_subtotal();

-- Recomputes amount_paid and advances status to dp_diterima once the DP is covered.
create function public.refresh_order_payments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o
  set amount_paid = coalesce((select sum(p.amount) from public.payments p where p.order_id = v_order), 0)
  where o.id = v_order;

  update public.orders o
  set status = 'dp_diterima'
  where o.id = v_order
    and o.status in ('baru', 'menunggu_dp')
    and o.amount_paid > 0
    and o.amount_paid >= o.dp_amount;
  return null;
end;
$$;

create trigger payments_refresh_order
  after insert or update or delete on public.payments
  for each row execute function public.refresh_order_payments();

revoke execute on function public.refresh_order_subtotal() from public, anon, authenticated;
revoke execute on function public.refresh_order_payments() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Weekly capacity (deferred so all items of an order are in place; advisory
-- locks per product-week serialize concurrent orders)
-- ---------------------------------------------------------------------------

create function public.week_start(d date)
returns date
language sql
immutable
set search_path = ''
as $$
  select date_trunc('week', d::timestamp)::date;
$$;

create function public.check_order_capacity(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_used bigint;
begin
  for r in
    select distinct p.id as product_id, p.name, p.weekly_capacity, public.week_start(o.fulfill_date) as wk
    from public.orders o
    join public.order_items i on i.order_id = o.id
    join public.products p on p.id = i.product_id
    where o.id = p_order_id
      and o.status <> 'batal'
      and p.weekly_capacity is not null
    order by p.id
  loop
    perform pg_advisory_xact_lock(hashtext('capacity:' || r.product_id::text || ':' || r.wk::text));

    select coalesce(sum(i.qty), 0) into v_used
    from public.order_items i
    join public.orders o on o.id = i.order_id
    where i.product_id = r.product_id
      and o.status <> 'batal'
      and o.fulfill_date >= r.wk
      and o.fulfill_date < r.wk + 7;

    if v_used > r.weekly_capacity then
      raise exception 'PENUH: kuota "%" minggu mulai % hanya % (akan terisi %)',
        r.name, to_char(r.wk, 'DD-MM-YYYY'), r.weekly_capacity, v_used
        using errcode = 'check_violation';
    end if;
  end loop;
end;
$$;

revoke execute on function public.check_order_capacity(uuid) from public, anon, authenticated;

create function public.order_items_capacity_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.check_order_capacity(new.order_id);
  return null;
end;
$$;

create function public.orders_capacity_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'batal'
     and (new.fulfill_date is distinct from old.fulfill_date or old.status = 'batal') then
    perform public.check_order_capacity(new.id);
  end if;
  return null;
end;
$$;

revoke execute on function public.order_items_capacity_trigger() from public, anon, authenticated;
revoke execute on function public.orders_capacity_trigger() from public, anon, authenticated;

create constraint trigger order_items_capacity
  after insert or update of qty, product_id, order_id on public.order_items
  deferrable initially deferred
  for each row execute function public.order_items_capacity_trigger();

create constraint trigger orders_capacity
  after update of fulfill_date, status on public.orders
  deferrable initially deferred
  for each row execute function public.orders_capacity_trigger();

-- ---------------------------------------------------------------------------
-- Order rules for new orders / date changes (lead time, campaign window)
-- ---------------------------------------------------------------------------

create function public.validate_order_rules(p_order_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  o record;
  c record;
  v_today date := public.today_jakarta();
  v_lead integer;
  v_bad text;
begin
  select * into o from public.orders where id = p_order_id;

  if not exists (select 1 from public.order_items where order_id = p_order_id) then
    raise exception 'Order harus berisi minimal 1 produk' using errcode = 'check_violation';
  end if;

  select string_agg(p.name, ', ') into v_bad
  from public.order_items i join public.products p on p.id = i.product_id
  where i.order_id = p_order_id and (not p.is_active or not p.preorder_enabled);
  if v_bad is not null then
    raise exception 'Produk tidak bisa dipreorder: %', v_bad using errcode = 'check_violation';
  end if;

  select max(p.min_lead_days) into v_lead
  from public.order_items i join public.products p on p.id = i.product_id
  where i.order_id = p_order_id;
  if o.fulfill_date < v_today + coalesce(v_lead, 0) then
    raise exception 'Tanggal terlalu dekat: paling cepat % (lead time % hari)',
      to_char(v_today + v_lead, 'DD-MM-YYYY'), v_lead using errcode = 'check_violation';
  end if;

  if o.campaign_id is not null then
    select * into c from public.campaigns where id = o.campaign_id;
    if v_today < c.preorder_open or v_today > c.preorder_close then
      raise exception 'Preorder "%" hanya dibuka % s/d %', c.name,
        to_char(c.preorder_open, 'DD-MM-YYYY'), to_char(c.preorder_close, 'DD-MM-YYYY')
        using errcode = 'check_violation';
    end if;
    if (c.fulfill_start is not null and o.fulfill_date < c.fulfill_start)
       or (c.fulfill_end is not null and o.fulfill_date > c.fulfill_end) then
      raise exception 'Tanggal ambil/kirim "%" harus antara % dan %', c.name,
        coalesce(to_char(c.fulfill_start, 'DD-MM-YYYY'), '-'), coalesce(to_char(c.fulfill_end, 'DD-MM-YYYY'), '-')
        using errcode = 'check_violation';
    end if;
    select string_agg(p.name, ', ') into v_bad
    from public.order_items i join public.products p on p.id = i.product_id
    where i.order_id = p_order_id
      and not exists (select 1 from public.campaign_products cp
                      where cp.campaign_id = o.campaign_id and cp.product_id = i.product_id);
    if v_bad is not null then
      raise exception 'Produk tidak termasuk campaign "%": %', c.name, v_bad using errcode = 'check_violation';
    end if;
  end if;
end;
$$;

revoke execute on function public.validate_order_rules(uuid) from public, anon;
