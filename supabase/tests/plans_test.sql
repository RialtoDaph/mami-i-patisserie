-- Approvals, targets, goals and milestones (stage 5c). Run via scripts/test-db.sh after team_test.sql
-- (users: a…01 owner, a…02 admin, a…03 produksi, a…04 manager, a…06 crew; a…07 admin "Mami" is added here).
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

insert into auth.users (id, email) values ('a0000000-0000-4000-8000-000000000007', 'mami2@x');
update profiles set role = 'admin', full_name = 'Mami', approval_backup = true where id = 'a0000000-0000-4000-8000-000000000007';

-- ---------------------------------------------------------------- approvals follow the limits
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select pg_temp.expect_value($q$select submit_approval('alat', 'Chiller 2 pintu', 8500000, 'kompresor lemah')$q$, 'menunggu', 'alat above limit waits');
select pg_temp.expect_value($q$select submit_approval('alat', 'Ganti selang', 2000000, null)$q$, 'dicatat', 'alat at limit is recorded');
select pg_temp.expect_value($q$select submit_approval('campaign', 'Iklan IG', 1000001, null)$q$, 'menunggu', 'campaign above its limit waits');
select pg_temp.expect_value($q$select submit_approval('harga', 'Croissant 28.000 → 32.000', 0, null)$q$, 'menunggu', 'price change always waits');
select pg_temp.expect_error($q$insert into approvals (kind, title, status) values ('alat', 'x', 'disetujui')$q$, 'row-level security', 'no direct insert');
select pg_temp.expect_error($q$select decide_approval((select id from approvals where title = 'Chiller 2 pintu'), true, null)$q$, 'Hanya Alto', 'manager cannot decide');
select pg_temp.expect_value('select count(*)::text from team_names()', '7', 'manager sees team names');
reset role;

set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';
select pg_temp.expect_error($q$select submit_approval('alat', 'Mixer', 100, null)$q$, 'Tidak punya akses', 'pastry chef cannot submit');
select pg_temp.expect_value('select count(*)::text from approvals', '0', 'pastry chef sees no approvals');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000006';
select pg_temp.expect_value('select count(*)::text from team_names()', '0', 'crew sees no names');
reset role;

-- Backup decider: not before the fallback hours, yes after; other admins never.
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000007';
select pg_temp.expect_error($q$select decide_approval((select id from approvals where title = 'Chiller 2 pintu'), true, null)$q$, 'Hanya Alto', 'backup waits 48 h');
reset role;
update approvals set created_at = now() - interval '49 hours' where title in ('Chiller 2 pintu', 'Iklan IG');
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
select pg_temp.expect_error($q$select decide_approval((select id from approvals where title = 'Iklan IG'), true, null)$q$, 'Hanya Alto', 'admin without backup flag cannot decide');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000007';
select decide_approval((select id from approvals where title = 'Chiller 2 pintu'), false, 'Tunggu servis dulu');
select pg_temp.expect_value($q$select status || '|' || decision_note from approvals where title = 'Chiller 2 pintu'$q$, 'ditolak|Tunggu servis dulu', 'backup decided after 48 h');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
select decide_approval((select id from approvals where title = 'Iklan IG'), true, null);
select pg_temp.expect_value($q$select status from approvals where title = 'Iklan IG'$q$, 'disetujui', 'owner approves');
select pg_temp.expect_error($q$select decide_approval((select id from approvals where title = 'Iklan IG'), false, null)$q$, 'sudah diputuskan', 'decided once');
-- Only the owner changes the rules.
update approval_rules set alat_limit = 3000000;
select pg_temp.expect_value($q$select submit_approval('alat', 'Oven kecil', 2500000, null)$q$, 'dicatat', 'new limit applies');
reset role;
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
update approval_rules set alat_limit = 1;
select pg_temp.expect_value('select alat_limit::text from approval_rules', '3000000', 'admin cannot change rules');
reset role;

-- ---------------------------------------------------------------- goals, milestones, targets
set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000001';
insert into goals (title, area, pic, due_date) values ('Area duduk baru', 'Interior', 'a0000000-0000-4000-8000-000000000002', '2027-01-31');
insert into milestones (goal_id, title, due_date, pic, cost)
select id, 'Penawaran 3 vendor', '2026-10-25', 'a0000000-0000-4000-8000-000000000004', 0 from goals;
insert into milestones (goal_id, title, due_date, pic, cost)
select id, 'Pengerjaan interior', '2026-12-15', 'a0000000-0000-4000-8000-000000000002', 15000000 from goals;
insert into monthly_targets (month, cafe_revenue, orders, food_cost_pct) values ('2026-10-01', 130000000, 60, 35);
select pg_temp.expect_error($q$insert into monthly_targets (month) values ('2026-10-15')$q$, 'monthly_targets_month_check', 'month starts on day 1');
reset role;

set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000004';
select set_milestone_status((select id from milestones where title = 'Penawaran 3 vendor'), 'jalan');
select pg_temp.expect_value($q$select status || '|' || (status_by = auth.uid())::text from milestones where title = 'Penawaran 3 vendor'$q$, 'jalan|true', 'manager updates own milestone');
select pg_temp.expect_error($q$select set_milestone_status((select id from milestones where title = 'Pengerjaan interior'), 'jalan')$q$, 'Hanya PIC', 'manager cannot update others');
select pg_temp.expect_error($q$select set_milestone_status((select id from milestones where title = 'Penawaran 3 vendor'), 'telat')$q$, 'Status tidak dikenal', 'telat is computed');
update goals set title = 'x';
select pg_temp.expect_value('select title from goals', 'Area duduk baru', 'manager cannot edit goals');
update monthly_targets set orders = 1;
select pg_temp.expect_value('select orders::text from monthly_targets', '60', 'manager cannot edit targets');
select pg_temp.expect_value($q$select submit_approval('alat', 'Area duduk: Pengerjaan interior', 15000000, null, (select id from milestones where title = 'Pengerjaan interior'))$q$, 'menunggu', 'milestone cost submitted');
select pg_temp.expect_error($q$select submit_approval('alat', 'lagi', 15000000, null, (select id from milestones where title = 'Pengerjaan interior'))$q$, 'sudah diajukan', 'milestone cost submitted once');
reset role;

set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000002';
select set_milestone_status((select id from milestones where title = 'Pengerjaan interior'), 'selesai');
select pg_temp.expect_value($q$select status from milestones where title = 'Pengerjaan interior'$q$, 'selesai', 'owner (admin) updates any milestone');
reset role;

set role authenticated; set request.jwt.claim.sub = 'a0000000-0000-4000-8000-000000000003';
select pg_temp.expect_value('select (select count(*) from goals) + (select count(*) from monthly_targets)', '0', 'pastry chef sees no plans');
reset role;

select 'ALL PLANS TESTS PASSED';
