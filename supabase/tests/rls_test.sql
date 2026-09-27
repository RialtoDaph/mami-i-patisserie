-- RLS/trigger behavior tests. Run via scripts/test-db.sh against a throwaway database.
\set ON_ERROR_STOP 1
insert into auth.users (id, email) values
 ('a0000000-0000-4000-8000-000000000001','alto@x'),
 ('a0000000-0000-4000-8000-000000000002','nana@x'),
 ('a0000000-0000-4000-8000-000000000003','mami@x'),
 ('a0000000-0000-4000-8000-000000000004','manager@x'),
 ('a0000000-0000-4000-8000-000000000005','norole@x');
update profiles set role='owner' where id='a0000000-0000-4000-8000-000000000001';
update profiles set role='admin' where id='a0000000-0000-4000-8000-000000000002';
update profiles set role='produksi' where id='a0000000-0000-4000-8000-000000000003';
update profiles set role='manager' where id='a0000000-0000-4000-8000-000000000004';

create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'OK (blocked) %: %', label, sqlerrm; return; end;
  raise exception 'FAIL: % was allowed', label;
end $$;
create or replace function pg_temp.expect_rows(sql text, n int, label text) returns void language plpgsql as $$
declare c int; begin execute 'with s as (' || sql || ') select count(*) from s' into c;
  if c <> n then raise exception 'FAIL: % expected % got %', label, n, c; end if;
  raise notice 'OK %: % rows', label, c; end $$;

-- price per base unit
select name, price_per_base_unit from ingredients where name like '%Butter%' or name like '%Telur%';

-- anon sees nothing
set role anon;
select pg_temp.expect_fail('select * from ingredients', 'anon select');
reset role;

-- no-role user sees nothing
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000005';
select pg_temp.expect_rows('select * from ingredients', 0, 'norole ingredients');
select pg_temp.expect_fail($q$insert into ingredients(name,purchase_unit,purchase_qty,purchase_price,base_unit) values ('x','kg',1,1,'g')$q$, 'norole insert');
reset role;

-- manager read only
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select pg_temp.expect_rows('select * from ingredients', 17, 'manager ingredients');
select pg_temp.expect_fail($q$insert into ingredients(name,purchase_unit,purchase_qty,purchase_price,base_unit) values ('x','kg',1,1,'g')$q$, 'manager insert');
select pg_temp.expect_rows($q$update recipes set notes='x' returning 1$q$, 0, 'manager update recipes');
reset role;

-- produksi
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';
update ingredients set purchase_price = 16000 where id='d0000000-0000-4000-8000-000000000001';
select pg_temp.expect_rows($q$delete from ingredients where id='d0000000-0000-4000-8000-000000000007' returning 1$q$, 0, 'produksi delete ingredient');
select pg_temp.expect_fail($q$update recipes set selling_price=9000 where id='d1000000-0000-4000-8000-000000000001'$q$, 'produksi change price');
select pg_temp.expect_rows($q$update bundles set notes='x' returning 1$q$, 0, 'produksi update bundle');
select pg_temp.expect_rows('select * from profiles', 1, 'produksi sees own profile only');
select pg_temp.expect_rows($q$update profiles set role='owner' returning 1$q$, 0, 'produksi self-promote');
-- save_recipe as produksi: pricing ignored, other edits apply
select save_recipe('d1000000-0000-4000-8000-000000000001',
  '{"name":"[DUMMY] Risol Ragout Ayam","category":"mamis","yield_qty":32,"yield_unit":"pcs","waste_pct":5,"target_hpp_pct":10,"selling_price":1}',
  '[{"ingredient_id":"d0000000-0000-4000-8000-000000000001","quantity":250,"unit":"g"}]');
select pg_temp.expect_rows($q$select 1 from recipes where id='d1000000-0000-4000-8000-000000000001' and yield_qty=32 and selling_price=7000 and target_hpp_pct=35$q$, 1, 'produksi save_recipe keeps pricing');
select pg_temp.expect_rows($q$select 1 from recipe_items where recipe_id='d1000000-0000-4000-8000-000000000001'$q$, 1, 'items replaced');
select duplicate_recipe('d1000000-0000-4000-8000-000000000003') is not null as dup_ok;
select pg_temp.expect_rows($q$select 1 from recipes where name like '%(salinan)' and selling_price is null$q$, 1, 'produksi duplicate without price');
select pg_temp.expect_rows($q$select 1 from ingredient_price_history where ingredient_id='d0000000-0000-4000-8000-000000000001'$q$, 2, 'price history logged');
select pg_temp.expect_fail($q$insert into ingredient_price_history(ingredient_id,new_purchase_price,new_purchase_qty,new_price_per_base_unit) values ('d0000000-0000-4000-8000-000000000001',1,1,1)$q$, 'forge history');
reset role;

select changed_by, old_purchase_price, new_purchase_price from ingredient_price_history where ingredient_id='d0000000-0000-4000-8000-000000000001' order by id;

-- owner
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
-- cycle: pistachio cream uses pistachio croissant
select pg_temp.expect_fail($q$insert into recipe_items(recipe_id, sub_recipe_id, quantity, unit) values ('d1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000003',1,'pcs')$q$, 'cycle 2-level');
select pg_temp.expect_fail($q$insert into recipe_items(recipe_id, sub_recipe_id, quantity, unit) values ('d1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002',1,'g')$q$, 'self reference');
-- unit mismatch
select pg_temp.expect_fail($q$insert into recipe_items(recipe_id, ingredient_id, quantity, unit) values ('d1000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003',1,'g')$q$, 'unit mismatch');
select pg_temp.expect_fail($q$update ingredients set base_unit='ml', purchase_unit='liter' where id='d0000000-0000-4000-8000-000000000001'$q$, 'base unit change when used');
select pg_temp.expect_fail($q$delete from ingredients where id='d0000000-0000-4000-8000-000000000013'$q$, 'delete used ingredient');
select pg_temp.expect_fail($q$insert into ingredients(name,purchase_unit,purchase_qty,purchase_price,base_unit) values ('x','kg',1,1,'ml')$q$, 'kg->ml invalid');
update recipes set selling_price = 8000 where id='d1000000-0000-4000-8000-000000000001';
select save_bundle(null, '{"name":"Test","selling_price":100000}', '[{"recipe_id":"d1000000-0000-4000-8000-000000000001","quantity":4,"unit":"pcs"}]') is not null as bundle_ok;
select pg_temp.expect_rows('select * from profiles', 5, 'owner sees all profiles');
update profiles set role='admin' where id='a0000000-0000-4000-8000-000000000005';
reset role;
select 'ALL RLS TESTS PASSED';
