-- Removes all DUMMY seed data. Run in Supabase SQL Editor before entering real data.
-- Order matters because several references use ON DELETE RESTRICT.
-- Settings are not removed: edit them in the app (Lainnya → Pengaturan).
begin;
delete from public.orders where is_dummy;
delete from public.customers where is_dummy;
delete from public.campaigns where is_dummy;
delete from public.products where is_dummy;
delete from public.bundles where is_dummy;
delete from public.recipes where is_dummy and category <> 'sub_resep';
delete from public.recipes where is_dummy;
delete from public.ingredients where is_dummy;
commit;
