-- Preorder RLS / capacity / payment trigger tests. Run via scripts/test-db.sh after rls_test.sql.
\set ON_ERROR_STOP 1

-- Deferred capacity triggers must fire inside the exception block to be caught.
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin
    set constraints all immediate;
    execute sql;
  exception when others then raise notice 'OK (blocked) %: %', label, sqlerrm; return; end;
  raise exception 'FAIL: % was allowed', label;
end $$;
create or replace function pg_temp.expect_rows(sql text, n int, label text) returns void language plpgsql as $$
declare c int; begin execute 'with s as (' || sql || ') select count(*) from s' into c;
  if c <> n then raise exception 'FAIL: % expected % got %', label, n, c; end if;
  raise notice 'OK %: % rows', label, c; end $$;
create or replace function pg_temp.expect_value(sql text, expected text, label text) returns void language plpgsql as $$
declare v text; begin execute sql into v;
  if v is distinct from expected then raise exception 'FAIL: % expected % got %', label, expected, v; end if;
  raise notice 'OK %: %', label, v; end $$;

-- Seed-derived values ------------------------------------------------------------
select pg_temp.expect_value($q$select status::text from orders where id='d6000000-0000-4000-8000-000000000001'$q$, 'dp_diterima', 'seed DP auto-advances status');
select pg_temp.expect_value($q$select subtotal||'/'||total||'/'||amount_paid from orders where id='d6000000-0000-4000-8000-000000000001'$q$, '208000/208000/100000', 'order 1 totals');
select pg_temp.expect_value($q$select total::text from orders where id='d6000000-0000-4000-8000-000000000003'$q$, '328000', 'total = subtotal + ongkir - diskon');
select pg_temp.expect_value($q$select order_no from orders order by order_no limit 1$q$, 'MIP-0001', 'order number format');

-- A Monday two weeks ahead with no seed orders.
create temp table t_week as select (date_trunc('week', current_date + 14))::date as mon;
grant select on t_week to authenticated;

-- anon ------------------------------------------------------------------------
set role anon;
select pg_temp.expect_fail('select * from customers', 'anon reads customers');
reset role;

-- manager: read-only --------------------------------------------------------------
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select pg_temp.expect_rows('select * from orders', 4, 'manager reads orders');
select pg_temp.expect_fail($q$select save_order(null, '{"customer_id":"d5000000-0000-4000-8000-000000000003","fulfill_date":"2099-01-01","fulfill_method":"ambil"}', '[]')$q$, 'manager creates order');
reset role;

-- produksi (Mami) ---------------------------------------------------------------
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';

-- Blessings Box: capacity 5/week, lead 3 days, regular campaign is open.
select save_order(null,
  json_build_object('customer_id','d5000000-0000-4000-8000-000000000003','campaign_id','d4000000-0000-4000-8000-000000000001',
    'fulfill_date',(select mon + 2 from t_week),'fulfill_method','ambil','dp_amount',625000,'status','menunggu_dp')::jsonb,
  '[{"product_id":"d3000000-0000-4000-8000-000000000003","qty":5,"unit_price":250000}]') is not null as filled_week;
select pg_temp.expect_fail(format($q$select save_order(null,
  '{"customer_id":"d5000000-0000-4000-8000-000000000002","campaign_id":"d4000000-0000-4000-8000-000000000001","fulfill_date":"%s","fulfill_method":"ambil"}',
  '[{"product_id":"d3000000-0000-4000-8000-000000000003","qty":1,"unit_price":250000}]')$q$, (select mon + 6 from t_week)), 'capacity full (same week, Sunday)');
-- Next Monday is a new week.
select save_order(null,
  json_build_object('customer_id','d5000000-0000-4000-8000-000000000002','campaign_id','d4000000-0000-4000-8000-000000000001',
    'fulfill_date',(select mon + 7 from t_week),'fulfill_method','ambil')::jsonb,
  '[{"product_id":"d3000000-0000-4000-8000-000000000003","qty":1,"unit_price":250000}]') is not null as next_week_ok;
-- Direct insert bypassing the RPC is still capped.
select pg_temp.expect_fail(format($q$with o as (insert into orders (customer_id, fulfill_date) values ('d5000000-0000-4000-8000-000000000002','%s') returning id)
  insert into order_items (order_id, product_id, qty, unit_price) select id, 'd3000000-0000-4000-8000-000000000003', 1, 1 from o$q$, (select mon + 1 from t_week)), 'capacity enforced on direct insert');
-- Lead time (3 days for Blessings Box).
select pg_temp.expect_fail(format($q$select save_order(null,
  '{"customer_id":"d5000000-0000-4000-8000-000000000002","fulfill_date":"%s","fulfill_method":"ambil"}',
  '[{"product_id":"d3000000-0000-4000-8000-000000000003","qty":1,"unit_price":250000}]')$q$, current_date + 1), 'lead time');
-- Lebaran campaign is not open yet.
select pg_temp.expect_fail($q$select save_order(null,
  '{"customer_id":"d5000000-0000-4000-8000-000000000002","campaign_id":"d4000000-0000-4000-8000-000000000002","fulfill_date":"2027-02-25","fulfill_method":"ambil"}',
  '[{"product_id":"d3000000-0000-4000-8000-000000000001","qty":1,"unit_price":70000}]')$q$, 'campaign window closed');
select pg_temp.expect_fail($q$select save_order(null,
  '{"customer_id":"d5000000-0000-4000-8000-000000000002","fulfill_date":"2099-01-01","fulfill_method":"ambil"}', '[]')$q$, 'empty order');
select pg_temp.expect_fail($q$select save_order(null,
  '{"customer_id":"d5000000-0000-4000-8000-000000000002","fulfill_date":"2099-01-01","fulfill_method":"ambil","discount":999999}',
  '[{"product_id":"d3000000-0000-4000-8000-000000000002","qty":1,"unit_price":58000}]')$q$, 'discount above total');

-- Payments: partial DP keeps status, full DP advances it.
insert into payments (order_id, amount, method) values ('d6000000-0000-4000-8000-000000000002', 100000, 'qris');
select pg_temp.expect_value($q$select status::text from orders where id='d6000000-0000-4000-8000-000000000002'$q$, 'baru', 'partial DP keeps status');
insert into payments (order_id, amount, method) values ('d6000000-0000-4000-8000-000000000002', 50000, 'tunai');
select pg_temp.expect_value($q$select status||'/'||amount_paid from orders where id='d6000000-0000-4000-8000-000000000002'$q$, 'dp_diterima/150000', 'full DP advances status');

select pg_temp.expect_rows($q$delete from orders where id='d6000000-0000-4000-8000-000000000004' returning 1$q$, 0, 'produksi delete order');
select pg_temp.expect_rows($q$delete from payments returning 1$q$, 0, 'produksi delete payment');
select pg_temp.expect_rows($q$update products set price = 1 returning 1$q$, 0, 'produksi edit product');
select pg_temp.expect_rows($q$update settings set bank_name = 'x' returning 1$q$, 0, 'produksi edit settings');
select upsert_customer('6284444444444', 'Pelanggan Baru', 'Bandung', null) is not null as customer_created;
insert into storage.objects (bucket_id, name) values ('payment-proofs', 'test/proof.jpg');
select pg_temp.expect_fail($q$insert into storage.objects (bucket_id, name) values ('product-photos', 'x.jpg')$q$, 'produksi uploads product photo');
reset role;

-- Cancelling frees capacity; un-cancelling a full week is blocked.
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
update orders set status = 'batal' where fulfill_date = (select mon + 2 from t_week);
select save_order(null,
  json_build_object('customer_id','d5000000-0000-4000-8000-000000000001','campaign_id','d4000000-0000-4000-8000-000000000001',
    'fulfill_date',(select mon + 3 from t_week),'fulfill_method','ambil')::jsonb,
  '[{"product_id":"d3000000-0000-4000-8000-000000000003","qty":5,"unit_price":250000}]') is not null as refilled_after_cancel;
select pg_temp.expect_fail(format($q$update orders set status = 'baru' where fulfill_date = '%s' and status = 'batal'$q$, (select mon + 2 from t_week)), 'un-cancel into full week');
select pg_temp.expect_fail(format($q$update orders set fulfill_date = '%s' where id = 'd6000000-0000-4000-8000-000000000002'$q$, (select mon + 4 from t_week)), 'move order into full week');
insert into storage.objects (bucket_id, name) values ('product-photos', 'ok.jpg');
select pg_temp.expect_rows($q$update products set weekly_capacity = 10 where id='d3000000-0000-4000-8000-000000000003' returning 1$q$, 1, 'owner raises capacity');
reset role;

-- HPP snapshot per item is stored; missing unit_cost stays null.
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';
create temp table t_cost as select save_order(null,
  json_build_object('customer_id','d5000000-0000-4000-8000-000000000001','fulfill_date',(select mon + 21 from t_week),'fulfill_method','ambil')::jsonb,
  '[{"product_id":"d3000000-0000-4000-8000-000000000001","qty":2,"unit_price":75000,"unit_cost":21500},{"product_id":"d3000000-0000-4000-8000-000000000002","qty":1,"unit_price":58000}]') as id;
select pg_temp.expect_value($q$select string_agg(coalesce(unit_cost::text, 'null'), ',' order by sort_order) from order_items where order_id = (select id from t_cost)$q$, '21500,null', 'unit_cost snapshot stored');
reset role;

select 'ALL PREORDER TESTS PASSED';
