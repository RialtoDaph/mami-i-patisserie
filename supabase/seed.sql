-- =============================================================================
-- DUMMY SEED DATA — for trying out the app only. Prices are made up.
-- Every row has is_dummy = true and a name starting with "[DUMMY]".
-- Remove it all with supabase/remove_dummy.sql before entering real data.
-- =============================================================================

-- Ingredients ----------------------------------------------------------------
insert into public.ingredients
  (id, name, category, supplier, purchase_unit, purchase_qty, purchase_price, base_unit, is_dummy)
values
  ('d0000000-0000-4000-8000-000000000001', '[DUMMY] Tepung terigu protein sedang', 'bahan', 'Toko Bahan Kue (dummy)', 'kg', 1, 14000, 'g', true),
  ('d0000000-0000-4000-8000-000000000002', '[DUMMY] Butter unsalted 227 g', 'bahan', 'Toko Bahan Kue (dummy)', 'pack', 227, 45000, 'g', true),
  ('d0000000-0000-4000-8000-000000000003', '[DUMMY] Susu UHT full cream', 'bahan', 'Supermarket (dummy)', 'liter', 1, 20000, 'ml', true),
  ('d0000000-0000-4000-8000-000000000004', '[DUMMY] Telur ayam (1 tray)', 'bahan', 'Pasar (dummy)', 'pcs', 30, 60000, 'pcs', true),
  ('d0000000-0000-4000-8000-000000000005', '[DUMMY] Minyak goreng', 'bahan', 'Supermarket (dummy)', 'liter', 2, 38000, 'ml', true),
  ('d0000000-0000-4000-8000-000000000006', '[DUMMY] Daging ayam fillet', 'bahan', 'Pasar (dummy)', 'kg', 1, 55000, 'g', true),
  ('d0000000-0000-4000-8000-000000000007', '[DUMMY] Wortel', 'bahan', 'Pasar (dummy)', 'kg', 1, 15000, 'g', true),
  ('d0000000-0000-4000-8000-000000000008', '[DUMMY] Bawang bombay', 'bahan', 'Pasar (dummy)', 'kg', 1, 30000, 'g', true),
  ('d0000000-0000-4000-8000-000000000009', '[DUMMY] Tepung panir', 'bahan', 'Toko Bahan Kue (dummy)', 'kg', 1, 30000, 'g', true),
  ('d0000000-0000-4000-8000-000000000010', '[DUMMY] Pistachio paste 200 g', 'bahan', 'Importir (dummy)', 'pack', 200, 120000, 'g', true),
  ('d0000000-0000-4000-8000-000000000011', '[DUMMY] Whipping cream', 'bahan', 'Toko Bahan Kue (dummy)', 'liter', 1, 95000, 'ml', true),
  ('d0000000-0000-4000-8000-000000000012', '[DUMMY] Gula halus', 'bahan', 'Toko Bahan Kue (dummy)', 'kg', 1, 20000, 'g', true),
  ('d0000000-0000-4000-8000-000000000013', '[DUMMY] Croissant plain (supplier)', 'bahan', 'Pastry supplier (dummy)', 'pcs', 1, 12000, 'pcs', true),
  ('d0000000-0000-4000-8000-000000000021', '[DUMMY] Mika risol isi 10', 'kemasan', 'Toko Kemasan (dummy)', 'pcs', 50, 50000, 'pcs', true),
  ('d0000000-0000-4000-8000-000000000022', '[DUMMY] Box croissant', 'kemasan', 'Toko Kemasan (dummy)', 'pack', 20, 50000, 'pcs', true),
  ('d0000000-0000-4000-8000-000000000023', '[DUMMY] Box Blessings Box', 'kemasan', 'Percetakan (dummy)', 'pcs', 1, 25000, 'pcs', true),
  ('d0000000-0000-4000-8000-000000000024', '[DUMMY] Kartu ucapan', 'kemasan', 'Percetakan (dummy)', 'pcs', 100, 150000, 'pcs', true);

-- Recipes --------------------------------------------------------------------
insert into public.recipes
  (id, name, category, yield_qty, yield_unit, waste_pct, target_hpp_pct, selling_price, notes, is_dummy)
values
  ('d1000000-0000-4000-8000-000000000001', '[DUMMY] Risol Ragout Ayam', 'mamis', 30, 'pcs', 5, 35, 7000,
   'Contoh resep. Harga jual sengaja dibuat di atas target HPP supaya terlihat merah.', true),
  ('d1000000-0000-4000-8000-000000000002', '[DUMMY] Pistachio Cream', 'sub_resep', 500, 'g', 5, 35, null,
   'Sub-resep isian, dipakai di Pistachio Croissant.', true),
  ('d1000000-0000-4000-8000-000000000003', '[DUMMY] Pistachio Croissant', 'pastry_supplier', 10, 'pcs', 0, 35, 58000,
   'Croissant dari supplier + pistachio cream.', true);

insert into public.recipe_items (recipe_id, ingredient_id, sub_recipe_id, quantity, unit, sort_order)
values
  -- Risol ragout: skin + filling + coating + frying
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', null, 250, 'g', 0),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000004', null, 5, 'pcs', 1),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', null, 500, 'ml', 2),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', null, 50, 'g', 3),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000006', null, 0.5, 'kg', 4),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000007', null, 200, 'g', 5),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000008', null, 100, 'g', 6),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000009', null, 250, 'g', 7),
  ('d1000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000005', null, 300, 'ml', 8),
  -- Pistachio cream (sub-recipe, yields grams)
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000010', null, 100, 'g', 0),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', null, 300, 'ml', 1),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000012', null, 80, 'g', 2),
  ('d1000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000003', null, 100, 'ml', 3),
  -- Pistachio croissant: supplier croissant + 25 g cream each + box
  ('d1000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000013', null, 10, 'pcs', 0),
  ('d1000000-0000-4000-8000-000000000003', null, 'd1000000-0000-4000-8000-000000000002', 250, 'g', 1),
  ('d1000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000022', null, 10, 'pcs', 2);

-- Bundle ---------------------------------------------------------------------
insert into public.bundles (id, name, selling_price, target_hpp_pct, notes, is_dummy)
values
  ('d2000000-0000-4000-8000-000000000001', '[DUMMY] Blessings Box', 250000, 35,
   'Contoh paket: 6 risol + 2 pistachio croissant + box + kartu.', true);

insert into public.bundle_items (bundle_id, recipe_id, ingredient_id, quantity, unit, sort_order)
values
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001', null, 6, 'pcs', 0),
  ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000003', null, 2, 'pcs', 1),
  ('d2000000-0000-4000-8000-000000000001', null, 'd0000000-0000-4000-8000-000000000023', 1, 'pcs', 2),
  ('d2000000-0000-4000-8000-000000000001', null, 'd0000000-0000-4000-8000-000000000024', 1, 'pcs', 3);
