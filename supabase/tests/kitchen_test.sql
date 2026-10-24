-- Kitchen stock, production marks and waste log. Run via scripts/test-db.sh after team_test.sql
-- (users: a…01 owner, a…03 produksi, a…04 manager, a…06 crew).
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

create temp table t_ids as select (select id from ingredients order by name limit 1) as ing, (select id from products order by name limit 1) as prod;
grant select on t_ids to authenticated;
select pg_temp.expect_value('select count(*)::text from ingredient_price_history', (select count(*)::text from ingredient_price_history), 'history baseline');
create temp table t_hist as select count(*) as n from ingredient_price_history;

-- Pastry chef counts stock and sets a minimum; price history is untouched.
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';
update ingredients set stock_qty = 1500, stock_counted_at = now(), min_stock = 2000 where id = (select ing from t_ids);
select pg_temp.expect_value('select (stock_qty < min_stock)::text from ingredients where id = (select ing from t_ids)', 'true', 'below minimum');
insert into production_marks (production_date, product_id) select today_jakarta(), prod from t_ids;
insert into waste_logs (product_id, qty, reason) select prod, 3, 'tidak_laku' from t_ids;
insert into waste_logs (ingredient_id, qty, reason, note) select ing, 250, 'rusak', 'butter meleleh' from t_ids;
select pg_temp.expect_error($q$insert into waste_logs (qty, reason) values (1, 'lain')$q$, 'waste_one_item', 'waste needs exactly one item');
select pg_temp.expect_error($q$insert into waste_logs (product_id, qty, reason) select prod, 1, 'hilang' from t_ids$q$, 'reason', 'reason list');
delete from waste_logs where reason = 'rusak';
select pg_temp.expect_value('select count(*)::text from waste_logs', '1', 'creator deletes own entry today');
reset role;
select pg_temp.expect_value('select count(*)::text from ingredient_price_history', (select n::text from t_hist), 'stock count does not log a price change');

-- Manager reads but cannot write; crew sees nothing.
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select pg_temp.expect_value('select count(*)::text from production_marks', '1', 'manager reads marks');
select pg_temp.expect_error($q$insert into waste_logs (product_id, qty, reason) select prod, 1, 'gagal' from t_ids$q$, 'row-level security', 'manager cannot log waste');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000006';
select pg_temp.expect_value('select count(*)::text from waste_logs', '0', 'crew sees no waste');
select pg_temp.expect_error($q$insert into production_marks (production_date, product_id) select today_jakarta() + 1, prod from t_ids$q$, 'row-level security', 'crew cannot tick');
reset role;

select 'ALL KITCHEN TESTS PASSED';
