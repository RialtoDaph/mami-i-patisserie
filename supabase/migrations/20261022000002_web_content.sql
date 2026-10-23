-- Website content from the design handoff (prototype Web.dc.html + KEPUTUSAN.md), so the public site reads
-- products, campaigns and shipping fees from the database. Owner/admin edit them in the app.
--
-- PRICES AND SHIPPING FEES ARE SAMPLES from the prototype: products have price_pending = true (website shows
-- "harga menyusul") and settings.shipping_is_sample = true. Online orders stay closed (settings.web_orders_open)
-- until Alto sets real prices, fees, bank account and QRIS.
-- Products are not linked to costing recipes/bundles yet; link them in the app (Produk).

update public.settings set mode_natal = true, snow_mode = 'semua';

insert into public.products
  (slug, name, description, web_category, price, price_pending, show_on_website, preorder_enabled,
   min_lead_days, sort_order, photo_path, photo_note)
values
  ('classic-croissant', 'Mami''s Classic Croissant', 'Croissant butter klasik, dipanggang setiap pagi.', 'pastry', 28000, true, true, true, 2, 1, '/images/croissant.jpg', 'foto classic croissant'),
  ('cheese-danish', 'Signature Cheese Danish', 'Danish renyah dengan isian keju.', 'pastry', 32000, true, true, true, 2, 2, '/images/danish.jpg', 'foto cheese danish'),
  ('french-beignet', 'Traditional French Beignet', 'Donat Prancis dengan taburan gula halus.', 'pastry', 25000, true, true, true, 2, 3, '/images/beignet.jpg', 'foto beignet'),
  ('pistachio-almond-croissant', 'Pistachio & Almond Croissant', 'Croissant isi pistachio cream & almond.', 'pastry', 58000, true, true, true, 2, 4, '/images/pistachio-croissant.jpg', 'foto pistachio almond croissant'),
  ('heritage-risol', 'Mami''s Heritage Risol', 'Risol ragout ayam beku, isi 10. Tinggal goreng.', 'frozen', 75000, true, true, true, 2, 1, '/images/risol-frozen.jpg', 'foto risol frozen dalam mika'),
  ('croquette', 'Mami''s Croquette', 'Kroket beku, tinggal goreng.', 'frozen', 70000, true, true, true, 2, 2, '/images/kroket-frozen.jpg', 'foto kroket frozen'),
  ('signature-recipe', 'Mami''s Signature Recipe', 'Kue kering dari resep yang dikunci Mami selama 24 tahun, dalam box wine khas Mami I.', 'hampers', 185000, true, true, true, 2, 1, '/images/hampers-kue-kering.jpg', 'foto box hampers kue kering'),
  ('blessings-box', 'Mami''s Blessings Box', 'Pastry, risol, kroket, dan dalgona.', 'hampers', 250000, true, true, true, 2, 2, '/images/blessings-box.jpg', 'foto Blessings Box'),
  ('natal-mini', 'Natal Mini', 'untuk satu rumah', 'hampers', 165000, true, true, true, 2, 11, '/images/hampers-kue-kering.jpg', 'foto paket Natal Mini'),
  ('natal-classic', 'Natal Classic', 'untuk keluarga', 'hampers', 245000, true, true, true, 2, 12, '/images/hampers-kue-kering.jpg', 'foto paket Natal Classic'),
  ('natal-grande', 'Natal Grande', 'untuk keluarga besar atau kantor kecil', 'hampers', 385000, true, true, true, 2, 13, '/images/hampers-kue-kering.jpg', 'foto paket Natal Grande');

insert into public.campaigns (slug, name, preorder_open, preorder_close, fulfill_start, fulfill_end, quota, notes)
values
  ('natal-2026', 'Natal 2026', '2026-09-28', '2026-12-18', '2026-12-20', '2026-12-24', 100,
   'Hampers kue kering Natal. Ambil di dapur atau kirim JNE.'),
  ('lebaran-2027', 'Lebaran 2027', '2027-01-15', '2027-03-03', '2027-03-05', '2027-03-08', 150,
   'Hampers Lebaran 2027 (Idul Fitri ± 10 Maret 2027).');

insert into public.campaign_products (campaign_id, product_id)
select c.id, p.id
from public.campaigns c
join public.products p on p.slug = any (case c.slug
  when 'natal-2026' then array['natal-mini', 'natal-classic', 'natal-grande']
  when 'lebaran-2027' then array['blessings-box', 'signature-recipe'] end)
where c.slug in ('natal-2026', 'lebaran-2027');

-- SAMPLE flat fees from the prototype ("tarif asli belum ada").
insert into public.shipping_areas (method, area, fee, sort_order)
values
  ('kirim_instan', 'Bandung Tengah', 15000, 1),
  ('kirim_instan', 'Bandung Utara', 20000, 2),
  ('kirim_instan', 'Bandung Timur & Selatan', 25000, 3),
  ('kirim_instan', 'Cimahi', 30000, 4),
  ('ekspedisi', 'Jawa Barat', 35000, 1),
  ('ekspedisi', 'Jabodetabek', 45000, 2),
  ('ekspedisi', 'Jawa Tengah & DIY', 55000, 3),
  ('ekspedisi', 'Jawa Timur', 65000, 4);
