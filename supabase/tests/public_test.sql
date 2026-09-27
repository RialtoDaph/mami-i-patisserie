-- Public website RPC tests. Run via scripts/test-db.sh.
\set ON_ERROR_STOP 1
create or replace function pg_temp.expect_value(sql text, expected text, label text) returns void language plpgsql as $$
declare v text; begin execute sql into v;
  if v is distinct from expected then raise exception 'FAIL: % expected % got %', label, expected, v; end if;
  raise notice 'OK %: %', label, v; end $$;

set role anon;
select pg_temp.expect_value('select count(*)::text from public_catalog()', '0', 'anon catalog hides DUMMY');
select pg_temp.expect_value('select count(*)::text from public_catalog(true)', '3', 'anon catalog with DUMMY');
select pg_temp.expect_value($q$select web_category::text from public_catalog(true) where name like '%Risol%'$q$, 'frozen', 'web category');
select pg_temp.expect_value($q$select count(*)::text from public_campaigns(true)$q$, '2', 'open + upcoming campaigns');
select pg_temp.expect_value($q$select is_open::text || '/' || jsonb_array_length(products) from public_campaigns(true) where name like '%Lebaran%'$q$, 'false/2', 'Lebaran upcoming with 2 products');
select pg_temp.expect_value($q$select (products->0->>'price') from public_campaigns(true) where name like '%Lebaran%'$q$, '275000', 'campaign price override');
reset role;

-- Fill this week's Blessings Box quota (capacity 5) as owner, then anon sees it as full.
update products set weekly_capacity = 10 where id = 'd3000000-0000-4000-8000-000000000003';
insert into orders (id, customer_id, fulfill_date) values ('e6000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-000000000001', week_start(today_jakarta()) + 6);
insert into order_items (order_id, product_id, qty, unit_price) values ('e6000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000003', 10, 1);
set role anon;
select pg_temp.expect_value($q$select full_this_week::text from public_catalog(true) where name like '%Blessings%'$q$, 'true', 'full this week');
select pg_temp.expect_value($q$select full_this_week::text from public_catalog(true) where name like '%Croissant%'$q$, 'false', 'not full');
reset role;
select 'ALL PUBLIC TESTS PASSED';
