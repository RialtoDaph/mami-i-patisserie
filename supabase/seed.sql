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

-- =============================================================================
-- PREORDER (DUMMY)
-- =============================================================================

update public.settings set
  business_whatsapp = '6281200000000',
  bank_name = 'BCA (DUMMY)',
  bank_account_no = '0000000000',
  bank_account_name = 'Mami I Patisserie (DUMMY)',
  qris_note = 'QRIS tersedia, minta kodenya via WhatsApp (DUMMY)',
  pickup_address = 'Jl. Contoh No. 1, Bandung (DUMMY)',
  default_dp_percent = 50;

insert into public.products
  (id, name, description, recipe_id, bundle_id, units_per_product, price, show_on_website,
   preorder_enabled, weekly_capacity, min_lead_days, is_dummy)
values
  ('d3000000-0000-4000-8000-000000000001', '[DUMMY] Risol Ragout Frozen isi 10', 'Risol ragout ayam beku, tinggal goreng.',
   'd1000000-0000-4000-8000-000000000001', null, 10, 75000, true, true, 40, 2, true),
  ('d3000000-0000-4000-8000-000000000002', '[DUMMY] Pistachio Croissant', 'Croissant dengan pistachio cream.',
   'd1000000-0000-4000-8000-000000000003', null, 1, 58000, true, true, 30, 1, true),
  ('d3000000-0000-4000-8000-000000000003', '[DUMMY] Blessings Box', '6 risol + 2 pistachio croissant + kartu ucapan.',
   null, 'd2000000-0000-4000-8000-000000000001', 1, 250000, true, true, 5, 3, true);

-- A regular preorder campaign that is open around "today", plus Lebaran 2027.
insert into public.campaigns
  (id, name, preorder_open, preorder_close, fulfill_start, fulfill_end, dp_percent, notes, is_dummy)
values
  ('d4000000-0000-4000-8000-000000000001', '[DUMMY] Preorder Reguler', current_date - 30, current_date + 90,
   null, null, null, 'Campaign contoh yang sedang buka.', true),
  ('d4000000-0000-4000-8000-000000000002', '[DUMMY] Lebaran 2027', '2027-01-15', '2027-03-03',
   '2027-02-20', '2027-03-08', 50, 'Hampers Lebaran 2027 (Idul Fitri ± 10 Maret 2027).', true);

insert into public.campaign_products (campaign_id, product_id, price_override)
values
  ('d4000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', null),
  ('d4000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000002', null),
  ('d4000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000003', null),
  ('d4000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000001', 70000),
  ('d4000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000003', 275000);

insert into public.customers (id, name, whatsapp, address, notes, is_dummy)
values
  ('d5000000-0000-4000-8000-000000000001', '[DUMMY] Bu Rina', '6281111111111', 'Jl. Dago No. 10, Bandung', 'Suka pedas', true),
  ('d5000000-0000-4000-8000-000000000002', '[DUMMY] Pak Budi', '6282222222222', 'Jl. Riau No. 5, Bandung', null, true),
  ('d5000000-0000-4000-8000-000000000003', '[DUMMY] Kak Sari', '6283333333333', 'Cimahi', null, true);

-- Orders are dated relative to today so the production schedule has something to show.
insert into public.orders
  (id, customer_id, campaign_id, fulfill_date, fulfill_method, delivery_address, status,
   shipping_fee, discount, dp_amount, notes, is_dummy)
values
  ('d6000000-0000-4000-8000-000000000001', 'd5000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001',
   current_date + 3, 'ambil', null, 'menunggu_dp', 0, 0, 100000, null, true),
  ('d6000000-0000-4000-8000-000000000002', 'd5000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001',
   current_date + 3, 'kirim_instan', 'Jl. Riau No. 5, Bandung', 'baru', 25000, 0, 150000, 'Kirim sore', true),
  ('d6000000-0000-4000-8000-000000000003', 'd5000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001',
   current_date + 5, 'ekspedisi', 'Jl. Dago No. 10, Bandung', 'baru', 30000, 10000, 170000, null, true),
  ('d6000000-0000-4000-8000-000000000004', 'd5000000-0000-4000-8000-000000000003', null,
   current_date + 4, 'ambil', null, 'baru', 0, 0, 58000, null, true);

insert into public.order_items (order_id, product_id, qty, unit_price, sort_order)
values
  ('d6000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000001', 2, 75000, 0),
  ('d6000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000002', 1, 58000, 1),
  ('d6000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000003', 1, 250000, 0),
  ('d6000000-0000-4000-8000-000000000002', 'd3000000-0000-4000-8000-000000000001', 1, 75000, 1),
  ('d6000000-0000-4000-8000-000000000003', 'd3000000-0000-4000-8000-000000000003', 1, 250000, 0),
  ('d6000000-0000-4000-8000-000000000003', 'd3000000-0000-4000-8000-000000000002', 1, 58000, 1),
  ('d6000000-0000-4000-8000-000000000004', 'd3000000-0000-4000-8000-000000000002', 2, 58000, 0);

-- One DP payment (auto-advances order 1 to dp_diterima).
insert into public.payments (order_id, amount, method, note)
values ('d6000000-0000-4000-8000-000000000001', 100000, 'transfer', 'DP (DUMMY)');
