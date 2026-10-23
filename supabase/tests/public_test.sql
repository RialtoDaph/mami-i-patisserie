-- Public website RPC + web checkout tests. Run via scripts/test-db.sh.
-- Uses the website content from migration 20261022000002 (Natal 2026 is open from 2026-09-28 to 2026-12-18);
-- tests that depend on "today" move the campaign window around today instead of relying on the calendar.
\set ON_ERROR_STOP 1
create or replace function pg_temp.expect_value(sql text, expected text, label text) returns void language plpgsql as $$
declare v text; begin execute sql into v;
  if v is distinct from expected then raise exception 'FAIL: % expected % got %', label, expected, v; end if;
  raise notice 'OK %: %', label, v; end $$;
create or replace function pg_temp.expect_error(sql text, needle text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if position(needle in sqlerrm) > 0 then raise notice 'OK %: %', label, sqlerrm; return; end if;
    raise exception 'FAIL: % wrong error: %', label, sqlerrm;
  end;
  raise exception 'FAIL: % expected error containing "%"', label, needle; end $$;

-- Keep the Natal campaign open around today and its fulfil window ahead of the lead time.
update campaigns set preorder_open = today_jakarta() - 1, preorder_close = today_jakarta() + 30,
  fulfill_start = today_jakarta() + 5, fulfill_end = today_jakarta() + 9 where slug = 'natal-2026';
update campaigns set preorder_open = today_jakarta() + 60, preorder_close = today_jakarta() + 90,
  fulfill_start = today_jakarta() + 92, fulfill_end = today_jakarta() + 95 where slug = 'lebaran-2027';

-- ---------------------------------------------------------------- read RPCs
set role anon;
select pg_temp.expect_value('select count(*)::text from public_catalog()', '11', 'catalog: website products');
select pg_temp.expect_value('select count(*)::text from public_catalog(true)', '14', 'catalog incl. DUMMY');
select pg_temp.expect_value($q$select price_pending::text from public_catalog() where slug='classic-croissant'$q$, 'true', 'sample price flagged');
select pg_temp.expect_value($q$select string_agg(slug, ',' order by preorder_open) from public_campaigns()$q$, 'natal-2026,lebaran-2027', 'campaigns open + upcoming');
select pg_temp.expect_value($q$select quota||'/'||used||'/'||is_open||'/'||jsonb_array_length(products) from public_campaigns() where slug='natal-2026'$q$, '100/0/true/3', 'natal quota');
select pg_temp.expect_value('select count(*)::text from public_shipping_areas()', '8', 'shipping areas');
select pg_temp.expect_value('select dp_percent::int||''/''||dp_round||''/''||web_orders_open||''/''||mode_natal from public_settings()', '40/50000/false/true', 'public settings');
select pg_temp.expect_error('select * from products', 'permission denied', 'anon cannot read products table');
select pg_temp.expect_error('select * from shipping_areas', 'permission denied', 'anon cannot read shipping table');
reset role;

select pg_temp.expect_value('select dp_for(250000, 40, 50000)::text', '100000', 'DP exact');
select pg_temp.expect_value('select dp_for(265000, 40, 50000)::text', '150000', 'DP rounds up to 50k');
select pg_temp.expect_value('select dp_for(30000, 40, 50000)::text', '30000', 'DP capped at total');

-- ---------------------------------------------------------------- place_web_order
create temp table t_ord (r jsonb);
grant all on t_ord to anon;
create or replace function pg_temp.order_json(p_date date, p_mode text, p_items jsonb) returns jsonb language sql as $$
  select jsonb_build_object('name', 'Rina', 'whatsapp', '0812-3456-7890', 'method', 'kirim_instan', 'area', 'Cimahi',
    'address', 'Jl. Contoh 1', 'date', p_date, 'pay_mode', p_mode, 'pay_method', 'qris', 'items', p_items) $$;
create or replace function pg_temp.natal_items(n int) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('product_id', (select id from public_catalog() where slug='natal-classic'), 'qty', n,
    'card_note', 'Untuk Tante Rina: Selamat Natal! — Dimas')) $$;

set role anon;
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(1)))$q$, 'belum dibuka', 'orders closed by default');
reset role;
update settings set web_orders_open = true;

set role anon;
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+1, 'dp', pg_temp.natal_items(1)))$q$, 'paling cepat', 'H+2 rule');
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+12, 'dp', pg_temp.natal_items(1)))$q$, 'harus antara', 'campaign fulfil window');
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(101)))$q$, 'tidak tersedia', 'qty limit');
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(1)) || '{"area":"Mars"}')$q$, 'Area pengiriman', 'unknown area');
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(1)) || '{"whatsapp":"12345"}')$q$, 'WhatsApp', 'bad phone');
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp',
  pg_temp.natal_items(1) || jsonb_build_array(jsonb_build_object('product_id', (select id from public_catalog() where slug='croquette'), 'qty', 1))))$q$,
  'tidak termasuk campaign', 'regular product cannot join a campaign order');

-- 2 × Natal Classic (245.000) + Cimahi 30.000 = 520.000 → DP 40% = 208.000 → 250.000.
insert into t_ord select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(2)));
select pg_temp.expect_value($q$select (r->>'total')||'/'||(r->>'pay_now')||'/'||(r->>'pay_mode') from t_ord$q$, '520000/250000/dp', 'web order totals + DP');
reset role;
select pg_temp.expect_value($q$select o.status||'/'||o.channel||'/'||c.name||'/'||c.whatsapp||'/'||(o.expires_at > now()) from orders o join customers c on c.id=o.customer_id where o.id=(select (r->>'order_id')::uuid from t_ord)$q$,
  'menunggu_dp/web/Rina/6281234567890/true', 'order row');
select pg_temp.expect_value($q$select card_note from order_items where order_id=(select (r->>'order_id')::uuid from t_ord)$q$, 'Untuk Tante Rina: Selamat Natal! — Dimas', 'card note kept');
select pg_temp.expect_value($q$select used::text from public_campaigns() where slug='natal-2026'$q$, '2', 'quota used');

-- Proof upload: only into this order's folder with its token.
set role anon;
select pg_temp.expect_value($q$select web_proof_upload_allowed('web/' || (r->>'order_id') || '/' || (r->>'token') || '.jpg')::text from t_ord$q$, 'true', 'upload allowed with token');
select pg_temp.expect_value($q$select web_proof_upload_allowed('web/' || (r->>'order_id') || '/' || gen_random_uuid() || '.jpg')::text from t_ord$q$, 'false', 'upload refused without token');
select pg_temp.expect_error($q$select attach_web_payment((r->>'order_id')::uuid, (r->>'token')::uuid, 'web/' || (r->>'order_id') || '/' || (r->>'token') || '.jpg') from t_ord$q$, 'belum terupload', 'attach needs the object');
insert into storage.objects (bucket_id, name) select 'payment-proofs', 'web/' || (r->>'order_id') || '/' || (r->>'token') || '.jpg' from t_ord;
select pg_temp.expect_error($q$select attach_web_payment((r->>'order_id')::uuid, gen_random_uuid(), 'x') from t_ord$q$, 'tidak ditemukan', 'attach needs the token');
select pg_temp.expect_value($q$select attach_web_payment((r->>'order_id')::uuid, (r->>'token')::uuid, 'web/' || (r->>'order_id') || '/' || (r->>'token') || '.jpg') like 'MIP-%' from t_ord$q$, 'true', 'attach proof');
reset role;
select pg_temp.expect_value($q$select p.status||'/'||p.amount||'/'||p.method||'/'||o.amount_paid||'/'||o.status||'/'||(o.expires_at is null) from payments p join orders o on o.id=p.order_id where o.id=(select (r->>'order_id')::uuid from t_ord)$q$,
  'pending/250000/qris/0/menunggu_dp/true', 'pending proof does not count');
update payments set status = 'matched' where order_id = (select (r->>'order_id')::uuid from t_ord);
select pg_temp.expect_value($q$select amount_paid||'/'||status from orders where id=(select (r->>'order_id')::uuid from t_ord)$q$, '250000/dp_diterima', 'Bukti cocok advances status');

-- Lunas + pickup: DP choice ignored when paying in full.
set role anon;
insert into t_ord select place_web_order(pg_temp.order_json(today_jakarta()+7, 'lunas', pg_temp.natal_items(1)) || '{"method":"ambil","slot":"10.00–12.00"}');
select pg_temp.expect_value($q$select (r->>'total')||'/'||(r->>'pay_now')||'/'||(r->>'pay_mode') from t_ord order by r->>'order_no' desc limit 1$q$, '245000/245000/lunas', 'lunas pickup');
reset role;

-- Campaign quota (100 boxes, 3 used): 98 more is too many.
set role anon;
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(98)))$q$, 'PENUH', 'campaign quota');
reset role;

-- Daily quota for a hampers product.
update products set daily_quota = 4 where slug = 'natal-classic';
set role anon;
select pg_temp.expect_error($q$select place_web_order(pg_temp.order_json(today_jakarta()+6, 'dp', pg_temp.natal_items(3)))$q$, 'kuota harian', 'daily quota');
reset role;
update products set daily_quota = null where slug = 'natal-classic';

-- Unpaid web orders past the deadline are cancelled (lazily on the next order, or by the schedule).
set role anon;
insert into t_ord select place_web_order(pg_temp.order_json(today_jakarta()+8, 'dp', pg_temp.natal_items(1)));
reset role;
update orders set expires_at = now() - interval '1 minute' where order_no = (select r->>'order_no' from t_ord order by r->>'order_no' desc limit 1);
select pg_temp.expect_value('select cancel_expired_web_orders()::text', '1', 'expired order cancelled');
select pg_temp.expect_value($q$select used::text from public_campaigns() where slug='natal-2026'$q$, '3', 'cancelled order frees quota');

-- Staff payments recorded in the app still count immediately.
insert into payments (order_id, amount, method) values ('d6000000-0000-4000-8000-000000000004', 58000, 'tunai');
select pg_temp.expect_value($q$select status::text from orders where id='d6000000-0000-4000-8000-000000000004'$q$, 'dp_diterima', 'admin payment matched by default');
-- Staff editing a web order keeps the card note.
select save_order((r->>'order_id')::uuid,
  (select jsonb_build_object('customer_id', customer_id, 'campaign_id', campaign_id, 'fulfill_date', fulfill_date, 'fulfill_method', fulfill_method,
     'delivery_address', delivery_address, 'shipping_fee', shipping_fee, 'dp_amount', dp_amount) from orders where id = (t_ord.r->>'order_id')::uuid),
  (select jsonb_agg(jsonb_build_object('product_id', product_id, 'qty', qty, 'unit_price', unit_price)) from order_items where order_id = (t_ord.r->>'order_id')::uuid))
from t_ord order by r->>'order_no' limit 1;
select pg_temp.expect_value($q$select card_note from order_items where order_id=(select (r->>'order_id')::uuid from t_ord order by r->>'order_no' limit 1)$q$, 'Untuk Tante Rina: Selamat Natal! — Dimas', 'card note survives edit');
select 'ALL PUBLIC TESTS PASSED';
