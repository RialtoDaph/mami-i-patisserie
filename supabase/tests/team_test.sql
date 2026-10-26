-- Team login (PIN on registered devices) and per-role access tests. Run via scripts/test-db.sh after rls_test.sql
-- (which creates the users a…01 owner, a…02 admin, a…03 produksi, a…04 manager, a…05 no role).
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

insert into auth.users (id, email) values ('a0000000-0000-4000-8000-000000000006', 'barista@x');
update profiles set role = 'crew', full_name = 'Barista', title = 'Barista' where id = 'a0000000-0000-4000-8000-000000000006';
update profiles set full_name = 'Alto' where id = 'a0000000-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------- crew sees no business data
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000006';
select pg_temp.expect_value('select count(*)::text from orders', '0', 'crew orders');
select pg_temp.expect_value('select count(*)::text from customers', '0', 'crew customers');
select pg_temp.expect_value('select count(*)::text from ingredients', '0', 'crew ingredients');
select pg_temp.expect_value('select count(*)::text from settings', '0', 'crew settings');
select pg_temp.expect_value('select count(*)::text from profiles', '1', 'crew sees own profile only');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select pg_temp.expect_value('select (count(*) > 0)::text from orders', 'true', 'manager still reads orders');
reset role;

-- ---------------------------------------------------------------- pastry chef (produksi) status rule
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';
select pg_temp.expect_error($q$update orders set status = 'selesai' where id = 'd6000000-0000-4000-8000-000000000001'$q$, 'Diproduksi atau Siap', 'produksi cannot finish');
select pg_temp.expect_error($q$update orders set status = 'batal' where id = 'd6000000-0000-4000-8000-000000000001'$q$, 'Diproduksi atau Siap', 'produksi cannot cancel');
update orders set status = 'siap' where id = 'd6000000-0000-4000-8000-000000000001';
select pg_temp.expect_value($q$select status::text from orders where id = 'd6000000-0000-4000-8000-000000000001'$q$, 'siap', 'produksi marks siap');
reset role;

-- ---------------------------------------------------------------- inactive people lose access
update profiles set is_active = false where id = 'a0000000-0000-4000-8000-000000000004';
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select pg_temp.expect_value('select count(*)::text from orders', '0', 'inactive manager');
reset role;
update profiles set is_active = true where id = 'a0000000-0000-4000-8000-000000000004';

-- ---------------------------------------------------------------- PINs
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
select pg_temp.expect_error($q$select set_pin('a0000000-0000-4000-8000-000000000006', '1234')$q$, 'Hanya Alto', 'admin cannot set PINs');
select pg_temp.expect_error('select * from profile_pins', 'permission denied', 'no API access to PIN hashes');
select pg_temp.expect_error($q$select pin_check(repeat('a', 64), 'a0000000-0000-4000-8000-000000000006', '1234')$q$, 'permission denied', 'users cannot call pin_check');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select pg_temp.expect_error($q$select set_pin('a0000000-0000-4000-8000-000000000006', '12a4')$q$, '4 angka', 'PIN format');
select set_pin('a0000000-0000-4000-8000-000000000006', '2468');
select set_pin('a0000000-0000-4000-8000-000000000001', '1357');
select pg_temp.expect_value('select count(*)::text from pin_status()', '2', 'owner sees PIN status');
insert into devices (name, token_hash, created_by) values ('Tablet kafe', repeat('b', 64), 'a0000000-0000-4000-8000-000000000001');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
select pg_temp.expect_error($q$insert into devices (name, token_hash, created_by) values ('x', repeat('c', 64), 'a0000000-0000-4000-8000-000000000002')$q$, 'row-level security', 'only the owner registers devices');
reset role;

set role service_role;
select pg_temp.expect_value($q$select count(*)::text from pin_people(repeat('9', 64))$q$, '0', 'unknown device shows nobody');
select pg_temp.expect_value($q$select string_agg(full_name, ',' order by full_name) from pin_people(repeat('b', 64))$q$, 'Alto,Barista', 'registered device lists people with a PIN');
select pg_temp.expect_value($q$select pin_check(repeat('9', 64), 'a0000000-0000-4000-8000-000000000006', '2468')$q$, 'perangkat', 'PIN refused on unknown device');
select pg_temp.expect_value($q$select pin_check(repeat('b', 64), 'a0000000-0000-4000-8000-000000000006', '2468')$q$, 'ok', 'right PIN');
select pg_temp.expect_value($q$select pin_check(repeat('b', 64), 'a0000000-0000-4000-8000-000000000006', '0000')$q$, 'salah', 'wrong PIN 1');
select pin_check(repeat('b', 64), 'a0000000-0000-4000-8000-000000000006', '0000') from generate_series(1, 3);
select pg_temp.expect_value($q$select pin_check(repeat('b', 64), 'a0000000-0000-4000-8000-000000000006', '0000')$q$, 'terkunci', '5th wrong PIN locks');
select pg_temp.expect_value($q$select pin_check(repeat('b', 64), 'a0000000-0000-4000-8000-000000000006', '2468')$q$, 'terkunci', 'locked even with the right PIN');
reset role;
update devices set revoked_at = now() where token_hash = repeat('b', 64);
set role service_role;
select pg_temp.expect_value($q$select count(*)::text from pin_people(repeat('b', 64))$q$, '0', 'revoked device shows nobody');
reset role;

select 'ALL TEAM TESTS PASSED';
