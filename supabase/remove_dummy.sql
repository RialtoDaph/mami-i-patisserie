-- Removes all DUMMY seed data. Run in Supabase SQL Editor before entering real data.
-- Order matters because recipe/bundle items use ON DELETE RESTRICT.
begin;
delete from public.bundles where is_dummy;
delete from public.recipes where is_dummy and category <> 'sub_resep';
delete from public.recipes where is_dummy;
delete from public.ingredients where is_dummy;
commit;
