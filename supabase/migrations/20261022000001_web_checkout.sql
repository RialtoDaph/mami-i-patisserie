-- Website checkout (design handoff 2026-10, docs/DATA.md + KEPUTUSAN.md).
--
-- * Orders can come from the website: channel 'web', status 'menunggu_dp', paid by QRIS/transfer with a proof
--   photo, payment deadline (expires_at, default 60 min). Unpaid web orders past the deadline are cancelled.
-- * Payments get a status: website proofs start 'pending' and only count once staff mark them 'matched'
--   ("Bukti cocok"). Payments recorded by staff in the app are 'matched' right away (default).
-- * DP rule: dp% of the total rounded UP to settings.dp_round (default 40% / Rp 50.000), capped at the total.
-- * Quotas: daily quota per product (hampers) and a box quota per campaign, on top of the weekly capacity.
-- * Flat shipping fee per area (shipping_areas).
-- * Anon never touches base tables: read-only SECURITY DEFINER RPCs + place_web_order / attach_web_payment.
-- Keep in sync with src/lib/site/checkout.ts.

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

alter table public.settings
  add column dp_round bigint not null default 50000 check (dp_round > 0),
  add column min_lead_days integer not null default 2 check (min_lead_days >= 0),
  add column pay_timeout_min integer not null default 60 check (pay_timeout_min > 0),
  add column mode_natal boolean not null default false,
  add column snow_mode text not null default 'semua' check (snow_mode in ('hero', 'semua', 'mati')),
  add column web_orders_open boolean not null default false,
  add column shipping_is_sample boolean not null default true,
  add column qris_path text;

comment on column public.settings.mode_natal is 'Christmas takeover of the public website.';
comment on column public.settings.web_orders_open is 'Website checkout accepts orders only when true.';
comment on column public.settings.shipping_is_sample is 'Shipping fees are still samples (label shown at checkout).';

alter table public.settings alter column default_dp_percent set default 40;
update public.settings set default_dp_percent = 40;

-- ---------------------------------------------------------------------------
-- Products & campaigns
-- ---------------------------------------------------------------------------

-- A product may exist on the website before it is linked to a recipe/bundle in costing.
alter table public.products drop constraint products_one_source;
alter table public.products add constraint products_source check (recipe_id is null or bundle_id is null);

alter table public.products
  add column slug text unique check (slug ~ '^[a-z0-9-]+$'),
  add column price_pending boolean not null default false,
  add column daily_quota integer check (daily_quota > 0),
  add column sort_order integer not null default 0,
  add column photo_note text,
  add column allergens text[] not null default '{}',
  add column halal_note text;

comment on column public.products.price_pending is 'Price is not final yet: the website shows "harga menyusul".';
comment on column public.products.daily_quota is 'Max quantity per fulfill date (hampers). Null = unlimited.';
comment on column public.products.photo_path is 'Storage path in product-photos, or a site path starting with "/".';

alter table public.campaigns
  add column slug text unique check (slug ~ '^[a-z0-9-]+$'),
  add column quota integer check (quota > 0),
  add column target_revenue bigint check (target_revenue >= 0);

comment on column public.campaigns.quota is 'Max total quantity of campaign products across non-cancelled orders. Null = unlimited.';

-- ---------------------------------------------------------------------------
-- Shipping areas (flat fee per area)
-- ---------------------------------------------------------------------------

create table public.shipping_areas (
  id uuid primary key default gen_random_uuid(),
  method public.fulfill_method not null check (method <> 'ambil'),
  area text not null check (length(btrim(area)) > 0),
  fee bigint not null check (fee >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_dummy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (method, area)
);

create trigger shipping_areas_set_updated_at
  before update on public.shipping_areas
  for each row execute function public.set_updated_at();

alter table public.shipping_areas enable row level security;
revoke all on public.shipping_areas from anon;
create policy shipping_areas_select on public.shipping_areas for select to authenticated using ((select public.my_role()) is not null);
create policy shipping_areas_write on public.shipping_areas for all to authenticated
  using ((select public.has_role('owner', 'admin'))) with check ((select public.has_role('owner', 'admin')));

-- ---------------------------------------------------------------------------
-- Orders & payments
-- ---------------------------------------------------------------------------

create type public.order_channel as enum ('admin', 'web');
create type public.pay_mode as enum ('dp', 'lunas');
create type public.payment_status as enum ('pending', 'matched', 'rejected');

alter table public.orders
  add column channel public.order_channel not null default 'admin',
  add column pay_mode public.pay_mode,
  add column pay_method public.payment_method,
  add column expires_at timestamptz,
  add column delivery_area text,
  add column pickup_slot text,
  add column web_token uuid,
  add column utm jsonb;

comment on column public.orders.expires_at is 'Web orders: pay before this moment or the order is cancelled. Cleared once a proof is uploaded.';
comment on column public.orders.web_token is 'Secret handed to the browser that placed a web order; required to upload its payment proof.';

create index orders_web_pending_idx on public.orders (expires_at) where channel = 'web' and status in ('baru', 'menunggu_dp');

alter table public.order_items
  add column card_note text check (length(card_note) <= 300);

comment on column public.order_items.card_note is 'Greeting card text for hampers, handwritten by Mami.';

alter table public.payments
  add column status public.payment_status not null default 'matched',
  add column matched_by uuid references auth.users (id) on delete set null,
  add column matched_at timestamptz;

comment on column public.payments.status is 'pending = proof from the website, not checked yet. Only matched payments count.';

-- Only matched payments count towards amount_paid.
create or replace function public.refresh_order_payments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order uuid := coalesce(new.order_id, old.order_id);
begin
  update public.orders o
  set amount_paid = coalesce((select sum(p.amount) from public.payments p where p.order_id = v_order and p.status = 'matched'), 0)
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

-- save_order (app) keeps card notes of items when staff edit an order. Same signature, grants kept.
create or replace function public.save_order(p_id uuid, p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_old_date date;
  v_old_campaign uuid;
  v_date date := (p_order ->> 'fulfill_date')::date;
  v_campaign uuid := nullif(p_order ->> 'campaign_id', '')::uuid;
  v_notes jsonb;
begin
  if p_id is null then
    insert into public.orders (
      customer_id, campaign_id, fulfill_date, fulfill_method, delivery_address,
      status, shipping_fee, discount, dp_amount, notes
    ) values (
      (p_order ->> 'customer_id')::uuid,
      v_campaign,
      v_date,
      (p_order ->> 'fulfill_method')::public.fulfill_method,
      nullif(btrim(p_order ->> 'delivery_address'), ''),
      coalesce((p_order ->> 'status')::public.order_status, 'baru'),
      coalesce((p_order ->> 'shipping_fee')::bigint, 0),
      coalesce((p_order ->> 'discount')::bigint, 0),
      coalesce((p_order ->> 'dp_amount')::bigint, 0),
      nullif(btrim(p_order ->> 'notes'), '')
    )
    returning id into v_id;
  else
    select fulfill_date, campaign_id into v_old_date, v_old_campaign from public.orders where id = p_id;

    update public.orders o set
      customer_id = (p_order ->> 'customer_id')::uuid,
      campaign_id = v_campaign,
      fulfill_date = v_date,
      fulfill_method = (p_order ->> 'fulfill_method')::public.fulfill_method,
      delivery_address = nullif(btrim(p_order ->> 'delivery_address'), ''),
      shipping_fee = coalesce((p_order ->> 'shipping_fee')::bigint, 0),
      discount = coalesce((p_order ->> 'discount')::bigint, 0),
      dp_amount = coalesce((p_order ->> 'dp_amount')::bigint, 0),
      notes = nullif(btrim(p_order ->> 'notes'), '')
    where o.id = p_id
    returning o.id into v_id;

    if v_id is null then
      raise exception 'Order tidak ditemukan atau Anda tidak punya akses' using errcode = 'insufficient_privilege';
    end if;

    -- Keep greeting card texts (from the website) when staff edit the items.
    select jsonb_object_agg(product_id::text, card_note) into v_notes
    from public.order_items where order_id = v_id and card_note is not null;
    delete from public.order_items where order_id = v_id;
  end if;

  insert into public.order_items (order_id, product_id, qty, unit_price, unit_cost, card_note, sort_order)
  select v_id, (e ->> 'product_id')::uuid, (e ->> 'qty')::integer, (e ->> 'unit_price')::bigint,
         nullif(e ->> 'unit_cost', '')::bigint, coalesce(nullif(e ->> 'card_note', ''), v_notes ->> (e ->> 'product_id')),
         (t.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(e, ord);

  if p_id is null
     or v_old_date is distinct from v_date
     or v_old_campaign is distinct from v_campaign then
    perform public.validate_order_rules(v_id);
  end if;

  if (select o.discount > o.subtotal + o.shipping_fee from public.orders o where o.id = v_id) then
    raise exception 'Diskon lebih besar dari subtotal + ongkir' using errcode = 'check_violation';
  end if;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Quotas: weekly capacity (existing) + daily quota per product + campaign quota
-- ---------------------------------------------------------------------------

create or replace function public.check_order_capacity(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_used bigint;
begin
  if (select status from public.orders where id = p_order_id) = 'batal' then
    return;
  end if;

  -- Weekly capacity per product (Mon–Sun of the fulfill date).
  for r in
    select distinct p.id as product_id, p.name, p.weekly_capacity, public.week_start(o.fulfill_date) as wk
    from public.orders o
    join public.order_items i on i.order_id = o.id
    join public.products p on p.id = i.product_id
    where o.id = p_order_id and p.weekly_capacity is not null
    order by p.id
  loop
    perform pg_advisory_xact_lock(hashtext('capacity:' || r.product_id::text || ':' || r.wk::text));
    select coalesce(sum(i.qty), 0) into v_used
    from public.order_items i join public.orders o on o.id = i.order_id
    where i.product_id = r.product_id and o.status <> 'batal'
      and o.fulfill_date >= r.wk and o.fulfill_date < r.wk + 7;
    if v_used > r.weekly_capacity then
      raise exception 'PENUH: kuota "%" minggu mulai % hanya % (akan terisi %)',
        r.name, to_char(r.wk, 'DD-MM-YYYY'), r.weekly_capacity, v_used using errcode = 'check_violation';
    end if;
  end loop;

  -- Daily quota per product (hampers).
  for r in
    select distinct p.id as product_id, p.name, p.daily_quota, o.fulfill_date as d
    from public.orders o
    join public.order_items i on i.order_id = o.id
    join public.products p on p.id = i.product_id
    where o.id = p_order_id and p.daily_quota is not null
    order by p.id
  loop
    perform pg_advisory_xact_lock(hashtext('daily:' || r.product_id::text || ':' || r.d::text));
    select coalesce(sum(i.qty), 0) into v_used
    from public.order_items i join public.orders o on o.id = i.order_id
    where i.product_id = r.product_id and o.status <> 'batal' and o.fulfill_date = r.d;
    if v_used > r.daily_quota then
      raise exception 'PENUH: kuota harian "%" tanggal % hanya % (akan terisi %)',
        r.name, to_char(r.d, 'DD-MM-YYYY'), r.daily_quota, v_used using errcode = 'check_violation';
    end if;
  end loop;

  -- Campaign quota (total quantity of the campaign's products in its non-cancelled orders).
  for r in
    select c.id, c.name, c.quota
    from public.orders o join public.campaigns c on c.id = o.campaign_id
    where o.id = p_order_id and c.quota is not null
  loop
    perform pg_advisory_xact_lock(hashtext('campaign:' || r.id::text));
    v_used := public.campaign_used(r.id);
    if v_used > r.quota then
      raise exception 'PENUH: kuota "%" hanya % (akan terisi %)', r.name, r.quota, v_used using errcode = 'check_violation';
    end if;
  end loop;
end;
$$;

-- Quantity of a campaign's products in its non-cancelled orders.
create function public.campaign_used(p_campaign_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(i.qty), 0)
  from public.order_items i
  join public.orders o on o.id = i.order_id
  join public.campaign_products cp on cp.campaign_id = o.campaign_id and cp.product_id = i.product_id
  where o.campaign_id = p_campaign_id and o.status <> 'batal';
$$;

revoke execute on function public.campaign_used(uuid) from public, anon;
grant execute on function public.campaign_used(uuid) to authenticated;

-- Re-check quotas when an order is reactivated or its campaign changes too.
create or replace function public.orders_capacity_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'batal'
     and (new.fulfill_date is distinct from old.fulfill_date
          or new.campaign_id is distinct from old.campaign_id
          or old.status = 'batal') then
    perform public.check_order_capacity(new.id);
  end if;
  return null;
end;
$$;

drop trigger orders_capacity on public.orders;
create constraint trigger orders_capacity
  after update of fulfill_date, status, campaign_id on public.orders
  deferrable initially deferred
  for each row execute function public.orders_capacity_trigger();

-- ---------------------------------------------------------------------------
-- DP rule (mirror of dpAmount in src/lib/site/checkout.ts)
-- ---------------------------------------------------------------------------

create function public.dp_for(p_total bigint, p_percent numeric, p_round bigint)
returns bigint
language sql
immutable
set search_path = ''
as $$
  select case when p_total <= 0 then 0
              else least(p_total, (ceil(p_total * p_percent / 100.0 / p_round) * p_round)::bigint) end;
$$;

-- ---------------------------------------------------------------------------
-- Cancel unpaid web orders past their deadline. Called lazily before each new web order
-- and on a schedule (stage 6). DP is forfeited on cancellation by the customer (business rule, not code).
-- ---------------------------------------------------------------------------

create function public.cancel_expired_web_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.orders o
  set status = 'batal',
      notes = concat_ws(' · ', o.notes, 'Batal otomatis: belum bayar sampai batas waktu')
  where o.channel = 'web'
    and o.status in ('baru', 'menunggu_dp')
    and o.expires_at < now()
    and not exists (select 1 from public.payments p where p.order_id = o.id and p.status <> 'rejected');
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.cancel_expired_web_orders() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public read RPCs (anon)
-- ---------------------------------------------------------------------------

drop function public.public_catalog(boolean);
drop function public.public_campaigns(boolean);

create function public.public_settings()
returns table (
  dp_percent numeric, dp_round bigint, min_lead_days integer, pay_timeout_min integer,
  mode_natal boolean, snow_mode text, web_orders_open boolean, shipping_is_sample boolean,
  bank_name text, bank_account_no text, bank_account_name text, qris_path text, pickup_address text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.default_dp_percent, s.dp_round, s.min_lead_days, s.pay_timeout_min,
         s.mode_natal, s.snow_mode, s.web_orders_open, s.shipping_is_sample,
         s.bank_name, s.bank_account_no, s.bank_account_name, s.qris_path, s.pickup_address
  from public.settings s;
$$;

create function public.public_catalog(p_include_dummy boolean default false)
returns table (
  id uuid, slug text, name text, description text, web_category public.web_category,
  price bigint, price_pending boolean, photo_path text, photo_note text,
  min_lead_days integer, daily_quota integer, sort_order integer, allergens text[], halal_note text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.slug, p.name, p.description, p.web_category, p.price, p.price_pending, p.photo_path, p.photo_note,
         p.min_lead_days, p.daily_quota, p.sort_order, p.allergens, p.halal_note
  from public.products p
  where p.is_active and p.show_on_website and (p_include_dummy or not p.is_dummy)
  order by p.web_category, p.sort_order, p.name;
$$;

-- Campaigns that are open now or open in the future, with products, prices and quota left.
create function public.public_campaigns(p_include_dummy boolean default false)
returns table (
  id uuid, slug text, name text, preorder_open date, preorder_close date, fulfill_start date, fulfill_end date,
  dp_percent numeric, quota integer, used bigint, is_open boolean, products jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.slug, c.name, c.preorder_open, c.preorder_close, c.fulfill_start, c.fulfill_end, c.dp_percent,
    c.quota, public.campaign_used(c.id),
    public.today_jakarta() between c.preorder_open and c.preorder_close,
    coalesce((
      select jsonb_agg(jsonb_build_object('product_id', p.id, 'price', coalesce(cp.price_override, p.price)) order by p.sort_order, p.name)
      from public.campaign_products cp
      join public.products p on p.id = cp.product_id
      where cp.campaign_id = c.id and p.is_active and p.show_on_website and (p_include_dummy or not p.is_dummy)
    ), '[]'::jsonb)
  from public.campaigns c
  where c.is_active and c.preorder_close >= public.today_jakarta() and (p_include_dummy or not c.is_dummy)
  order by c.preorder_open;
$$;

create function public.public_shipping_areas(p_include_dummy boolean default false)
returns table (id uuid, method public.fulfill_method, area text, fee bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.method, a.area, a.fee
  from public.shipping_areas a
  where a.is_active and (p_include_dummy or not a.is_dummy)
  order by a.method, a.sort_order, a.area;
$$;

-- ---------------------------------------------------------------------------
-- Place a web order (anon). Everything is recomputed here from the database; the browser only sends choices.
-- p: { name, whatsapp, method, area, address, date, slot, note, pay_mode, pay_method, include_dummy, utm,
--      items: [{ product_id, qty, card_note }] }
-- ---------------------------------------------------------------------------

create function public.place_web_order(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.settings%rowtype;
  v_today date := public.today_jakarta();
  v_dummy boolean := coalesce((p ->> 'include_dummy')::boolean, false);
  v_name text := btrim(coalesce(p ->> 'name', ''));
  v_wa text := regexp_replace(coalesce(p ->> 'whatsapp', ''), '[^0-9]', '', 'g');
  v_method public.fulfill_method;
  v_date date;
  v_items jsonb := coalesce(p -> 'items', '[]'::jsonb);
  v_campaign uuid;
  v_campaign_count integer;
  v_fee bigint := 0;
  v_subtotal bigint;
  v_total bigint;
  v_dp bigint;
  v_pct numeric;
  v_mode public.pay_mode;
  v_customer uuid;
  v_order uuid;
  v_no text;
  v_token uuid := gen_random_uuid();
  v_expires timestamptz;
  v_bad text;
begin
  select * into s from public.settings;
  if not s.web_orders_open then
    raise exception 'Pemesanan online belum dibuka. Chat admin lewat WhatsApp, ya.' using errcode = 'check_violation';
  end if;

  perform public.cancel_expired_web_orders();

  -- Customer details
  if v_name = '' or length(v_name) > 80 then
    raise exception 'Nama belum diisi' using errcode = 'check_violation';
  end if;
  if v_wa like '0%' then v_wa := '62' || substr(v_wa, 2);
  elsif v_wa like '8%' then v_wa := '62' || v_wa;
  end if;
  if v_wa !~ '^628[0-9]{7,12}$' then
    raise exception 'Nomor WhatsApp belum benar' using errcode = 'check_violation';
  end if;

  -- Fulfillment
  begin
    v_method := (p ->> 'method')::public.fulfill_method;
    v_date := (p ->> 'date')::date;
  exception when others then
    raise exception 'Metode atau tanggal tidak valid' using errcode = 'check_violation';
  end;
  if v_method is null or v_date is null then
    raise exception 'Metode atau tanggal belum dipilih' using errcode = 'check_violation';
  end if;
  if v_date < v_today + s.min_lead_days then
    raise exception 'Tanggal paling cepat %', to_char(v_today + s.min_lead_days, 'DD-MM-YYYY') using errcode = 'check_violation';
  end if;
  if v_method <> 'ambil' then
    if btrim(coalesce(p ->> 'address', '')) = '' then
      raise exception 'Alamat belum diisi' using errcode = 'check_violation';
    end if;
    select a.fee into v_fee from public.shipping_areas a
    where a.method = v_method and a.area = p ->> 'area' and a.is_active and (v_dummy or not a.is_dummy);
    if v_fee is null then
      raise exception 'Area pengiriman tidak tersedia' using errcode = 'check_violation';
    end if;
  end if;

  -- Items: website products only, 1–100 each.
  if jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 30 then
    raise exception 'Keranjang kosong' using errcode = 'check_violation';
  end if;
  select string_agg(coalesce(e ->> 'product_id', '?'), ', ') into v_bad
  from jsonb_array_elements(v_items) e
  left join public.products pr on pr.id::text = e ->> 'product_id'
    and pr.is_active and pr.show_on_website and pr.preorder_enabled and (v_dummy or not pr.is_dummy)
  where pr.id is null
     or coalesce((e ->> 'qty')::integer, 0) not between 1 and 100
     or length(coalesce(e ->> 'card_note', '')) > 300;
  if v_bad is not null then
    raise exception 'Produk di keranjang tidak tersedia. Muat ulang halaman, ya.' using errcode = 'check_violation';
  end if;

  -- Campaign: the open campaign that sells these products (at most one per order).
  select count(distinct c.id), min(c.id::text)::uuid into v_campaign_count, v_campaign
  from jsonb_array_elements(v_items) e
  join public.campaign_products cp on cp.product_id = (e ->> 'product_id')::uuid
  join public.campaigns c on c.id = cp.campaign_id
  where c.is_active and v_today between c.preorder_open and c.preorder_close and (v_dummy or not c.is_dummy);
  if v_campaign_count > 1 then
    raise exception 'Produk dari dua campaign berbeda tidak bisa digabung dalam satu pesanan' using errcode = 'check_violation';
  end if;

  select sum((e ->> 'qty')::integer * coalesce(cp.price_override, pr.price)) into v_subtotal
  from jsonb_array_elements(v_items) e
  join public.products pr on pr.id = (e ->> 'product_id')::uuid
  left join public.campaign_products cp on cp.campaign_id = v_campaign and cp.product_id = pr.id;

  v_total := v_subtotal + v_fee;
  v_pct := coalesce((select c.dp_percent from public.campaigns c where c.id = v_campaign), s.default_dp_percent);
  v_dp := public.dp_for(v_total, v_pct, s.dp_round);
  v_mode := case when p ->> 'pay_mode' = 'dp' and v_dp < v_total then 'dp' else 'lunas' end;
  v_expires := now() + make_interval(mins => s.pay_timeout_min);

  -- Find or create the customer; existing customers are never renamed from the website.
  insert into public.customers (whatsapp, name) values (v_wa, v_name) on conflict (whatsapp) do nothing;
  select id into v_customer from public.customers where whatsapp = v_wa;

  insert into public.orders (
    customer_id, campaign_id, fulfill_date, fulfill_method, delivery_address, delivery_area, pickup_slot,
    status, shipping_fee, dp_amount, notes, channel, pay_mode, pay_method, expires_at, web_token, utm
  ) values (
    v_customer, v_campaign, v_date, v_method,
    case when v_method <> 'ambil' then btrim(p ->> 'address') end,
    case when v_method <> 'ambil' then p ->> 'area' end,
    case when v_method = 'ambil' then nullif(btrim(coalesce(p ->> 'slot', '')), '') end,
    'menunggu_dp', v_fee, case when v_mode = 'lunas' then v_total else v_dp end,
    nullif(btrim(left(coalesce(p ->> 'note', ''), 500)), ''),
    'web', v_mode,
    case when p ->> 'pay_method' = 'qris' then 'qris'::public.payment_method else 'transfer'::public.payment_method end,
    v_expires, v_token, case when jsonb_typeof(p -> 'utm') = 'object' then p -> 'utm' end
  )
  returning id, order_no into v_order, v_no;

  insert into public.order_items (order_id, product_id, qty, unit_price, card_note, sort_order)
  select v_order, pr.id, (e ->> 'qty')::integer, coalesce(cp.price_override, pr.price),
         nullif(btrim(coalesce(e ->> 'card_note', '')), ''), (t.ord - 1)::integer
  from jsonb_array_elements(v_items) with ordinality as t(e, ord)
  join public.products pr on pr.id = (e ->> 'product_id')::uuid
  left join public.campaign_products cp on cp.campaign_id = v_campaign and cp.product_id = pr.id;

  -- Lead time per product, campaign window and campaign membership; quotas right away (not at commit) so
  -- the shopper gets a clear "PENUH" message.
  perform public.validate_order_rules(v_order);
  set constraints all immediate;

  return jsonb_build_object(
    'order_id', v_order, 'order_no', v_no, 'token', v_token, 'total', v_total,
    'pay_now', case when v_mode = 'lunas' then v_total else v_dp end, 'pay_mode', v_mode, 'expires_at', v_expires
  );
end;
$$;

-- Browser uploads go to payment-proofs/web/<order_id>/<token>... while the order is still unpaid.
create function public.web_proof_upload_allowed(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.orders o
    where o.channel = 'web' and o.status in ('baru', 'menunggu_dp') and o.expires_at > now()
      and p_name like 'web/' || o.id::text || '/' || o.web_token::text || '%'
  );
$$;

-- Record the uploaded proof as a pending payment and stop the payment clock.
create function public.attach_web_payment(p_order_id uuid, p_token uuid, p_path text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders%rowtype;
begin
  select * into o from public.orders where id = p_order_id for update;
  if o.id is null or o.channel <> 'web' or o.web_token is distinct from p_token then
    raise exception 'Pesanan tidak ditemukan' using errcode = 'insufficient_privilege';
  end if;
  if o.status not in ('baru', 'menunggu_dp') or o.expires_at is null or o.expires_at < now() then
    raise exception 'Batas waktu bayar pesanan ini sudah lewat' using errcode = 'check_violation';
  end if;
  if p_path not like 'web/' || o.id::text || '/' || o.web_token::text || '%'
     or not exists (select 1 from storage.objects so where so.bucket_id = 'payment-proofs' and so.name = p_path) then
    raise exception 'Bukti bayar belum terupload' using errcode = 'check_violation';
  end if;

  insert into public.payments (order_id, amount, method, proof_path, status, note, created_by)
  values (o.id, case when o.pay_mode = 'lunas' then o.subtotal + o.shipping_fee - o.discount else o.dp_amount end,
          o.pay_method, p_path, 'pending', 'Bukti dari website', null);

  update public.orders set expires_at = null where id = o.id;
  return o.order_no;
end;
$$;

revoke execute on function public.public_settings() from public;
revoke execute on function public.public_catalog(boolean) from public;
revoke execute on function public.public_campaigns(boolean) from public;
revoke execute on function public.public_shipping_areas(boolean) from public;
revoke execute on function public.place_web_order(jsonb) from public;
revoke execute on function public.attach_web_payment(uuid, uuid, text) from public;
revoke execute on function public.web_proof_upload_allowed(text) from public;
grant execute on function public.public_settings() to anon, authenticated;
grant execute on function public.public_catalog(boolean) to anon, authenticated;
grant execute on function public.public_campaigns(boolean) to anon, authenticated;
grant execute on function public.public_shipping_areas(boolean) to anon, authenticated;
grant execute on function public.place_web_order(jsonb) to anon, authenticated;
grant execute on function public.attach_web_payment(uuid, uuid, text) to anon, authenticated;
grant execute on function public.web_proof_upload_allowed(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage: website proof uploads (images only, max 5 MB), staff read them as before.
-- ---------------------------------------------------------------------------

update storage.buckets
set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'payment-proofs';

create policy payment_proofs_web_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and public.web_proof_upload_allowed(name));
