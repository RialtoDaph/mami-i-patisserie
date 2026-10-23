# CLAUDE.md — Mami I Pâtisserie

Context for every Claude Code session working on this repository. Read this first.

## Business

- **Mami I Pâtisserie**: bakery cafe in Bandung, Indonesia. Physical outlet opens **October 2027**.
- From **January 2027** it sells online before the outlet opens: cookie hampers (kue kering),
  frozen risol & kroket, kue basah, and the **Blessings Box**.
- This repo is one codebase for both the **public website** (`/`) and the **internal app**
  (`/app`, login required).

## Team & roles

| Person | Job | Role (`app_role`) | Tabs (src/lib/appNav.ts) |
|---|---|---|---|
| Alto | Owner, lives in Germany, runs the system & finances | `owner` | all + Alto-only: Akun tim, targets, approval limits, payroll paid |
| Nana | Owner: brand & marketing | `admin` | all |
| Mami | Owner: production, recipes, standards | `admin` | all (decided 2026-10-24: prototype wins over APP.md) |
| Pastry chef | Production | `produksi` | beranda, order, produksi, tim, alat; may only move orders to Diproduksi/Siap |
| Manager kafe | Cafe manager | `manager` | kafe, mingguan, target, tim, persetujuan, alat |
| Barista, waiter, part-timer | Crew | `crew` | tim, alat (no order/customer/costing data) |

Mami uses a phone and is not very technical: the UI must work for her without long training.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, Auth, Storage, with **Row Level Security on every table**
- Deployed on Vercel
- Routes: public website at `/`, internal app at `/app/*` (middleware enforces login)

## Hard principles

- **POS will be Majoo.** Do NOT build cashier/POS features or transactional stock
  (stock in/out, sales recording). This system only covers what Majoo does not.
- Internal UI: **Bahasa Indonesia**, **mobile-first**, big tap targets, **max 3 steps per action**.
- Money is Rupiah, formatted like `Rp 25.000` (dot thousands separator, no decimals shown).
- Metric units only (g, kg, ml, liter, pcs, pack).
- **Code and code comments in English. UI text and README in Bahasa Indonesia.**
- Never commit secrets. Use `.env.local` (git-ignored) and keep `.env.example` up to date.
- When a decision is ambiguous, **ask Alto first — do not guess.**

## Current phase: Recipe costing module

### Data

1. **ingredients** (raw materials & packaging): name, category (`bahan` / `kemasan`), supplier,
   purchase unit (kg, liter, pcs, pack), quantity per purchase unit, purchase price,
   base unit (g, ml, pcs), price per base unit (computed automatically), updated_at.
2. **ingredient_price_history**: every price change is recorded.
3. **recipes**: name, category (Mami's, pastry supplier, minuman, isian/sub-resep),
   yield (pcs/portions per batch), waste %, target HPP %, selling price, active flag, notes.
4. **recipe_items**: an ingredient OR a sub-recipe (e.g. pistachio cream used in pistachio
   croissant), quantity, unit. **Circular references must be prevented.**
5. **bundles**: packaged products (Blessings Box, hampers) made of several recipes/products
   + packaging + card.

### Calculations (pure functions, unit tested)

- Cost per batch; cost per piece (accounting for waste)
- HPP % = cost per piece / selling price
- Suggested selling price = cost per piece / target HPP, rounded **up** to a multiple of
  Rp 500 or Rp 1.000 (selectable)
- Gross margin per piece
- Option to display prices including **PBJT 10%**
- Bundle cost = sum of the cost of all its contents

### Features

- CRUD for ingredients, recipes, bundles — simple forms that work on a phone
- Summary page: all products with cost, selling price, HPP %, colored
  (green = below target, red = above target)
- When an ingredient price changes, show the recipes whose HPP now exceeds target
- Duplicate a recipe (to create variations)
- Export summary to CSV
- Seed data clearly marked **DUMMY**: a few ingredients (flour, butter, milk, eggs, oil,
  packaging), one risol ragout recipe, one pistachio cream sub-recipe, one pistachio croissant
  (supplier croissant + pistachio cream), one Blessings Box.

### Way of working

1. Keep this file updated with decisions made.
2. Show a plan and wait for Alto's approval before writing code for a new phase.
3. Work in stages: schema & migrations + RLS → calculation functions + tests → UI.
4. README (Bahasa Indonesia): Supabase setup, env, run locally, deploy to Vercel.

## Repo map & commands

- `supabase/migrations/` — schema, RLS, RPCs (`save_recipe`, `duplicate_recipe`, `save_bundle`).
  Units logic in SQL (`purchase_unit_factor`, `unit_family`) must match `src/lib/costing/units.ts`.
- `supabase/seed.sql` DUMMY data · `supabase/remove_dummy.sql` · `supabase/tests/` + `scripts/test-db.sh` (RLS tests).
- `src/lib/costing/` — pure calculation functions + Vitest tests (`fixtures.ts` mirrors the seed).
- `src/lib/data.ts` (server data loading), `src/lib/actions.ts` (server actions), `src/lib/permissions.ts`
  (UI-only mirror of RLS), `src/proxy.ts` (Next 16 "proxy" = middleware; guards `/app`).
- `src/lib/preorder/` — pure preorder logic + tests (capacity, payment/DP, validation, WhatsApp messages,
  production schedule, dashboard, filters). SQL mirrors: `week_start`, `check_order_capacity`, `validate_order_rules`.
- Shopping list & gross profit: `src/lib/preorder/shopping.ts`, `profit.ts` (pure, tested); page `/app/produksi/belanja`
  (+ `/export` CSV), params in `src/lib/shoppingParams.ts`. `order_items.unit_cost` = HPP snapshot set by `saveOrder`.
- `src/lib/preorderData.ts` (loads all preorder data), `src/lib/preorderActions.ts`, `src/lib/upload.ts`
  (client-side photo compress + Storage upload), `src/lib/errors.ts`.
- App nav (stage 5a): 6 groups in `src/lib/appNav.ts` (pure, tested): Beranda · Order (Order, Produksi) · Kafe (Laporan
  kafe, Mingguan) · Uang (Laporan, Costing, Target) · Tim (Tim, Persetujuan) · Lainnya (Menu lain, Alat; Legal + Konten open
  from the Lainnya list). Costing keeps `/app/bahan`, `/app/resep`, `/app/paket`; Lainnya keeps `/app/pelanggan`, `/app/produk`,
  `/app/campaign`, `/app/pengaturan`, `/app/lainnya/akun` (Akun tim, owner only). Shell = `src/components/app/AppShell.tsx`
  (top bar ≥ 760px, bottom nav on phones, pill tabs / underline tabs, "Semua menu", Ctrl K). Route guard per role in
  `src/app/app/template.tsx` (path from the proxy's `x-pathname` header). Sections not built yet show `ComingSoon`.
  CSV: `/app/costing/export`, `/app/order/export`.
- Team login (stage 5a): `/login` shows "Siapa yang masuk?" + 4-digit PIN keypad only on devices Alto registered in
  Akun tim (httpOnly cookie `mami_device`, sha256 in `devices`); elsewhere email + password. `src/lib/teamDevice.ts`
  (server-only), `src/lib/teamAuth.ts` (actions): `pin_check` RPC (5 wrong → locked 15 min) → admin magic-link token →
  `verifyOtp` on the server = normal Supabase session. PIN-only people get an `@mami-i.invalid` email (never mailed).
  Needs `SUPABASE_SECRET_KEY` (`src/lib/supabase/admin.ts`). Sign-out is `scope: local` (shared tablets).
- Public site (redesign 2026-10): route group `src/app/(site)` (`/`, `/menu`, `/hampers`, `/tentang`, `/faq`, `/kontak`,
  `/keranjang` = 3-step checkout; `/katalog` redirects to `/menu`). Page bodies in `src/components/site/pages`, header/
  drawers/footer in `src/components/site`. Data (stage 4): `src/lib/site/data.ts` (`loadSiteData`, server-only, React cache)
  calls the anon RPCs `public_settings`, `public_catalog`, `public_campaigns`, `public_shipping_areas`; on error it falls
  back to empty data with orders closed. Pages revalidate every 60 s. `src/content/catalog.ts` is presentation only (box
  contents, cafe menu, keyed by product slug); `campaigns.ts` (date formatting), `shipping.ts` (pickup slots), `site.ts`
  (contact PLACEHOLDERs). Pure logic + tests in `src/lib/site` (cart, checkout: DP/date rules). Checkout: `orderActions.ts`
  `placeWebOrder` → RPC `place_web_order`, proof photo uploaded by the browser to `payment-proofs/web/<order_id>/<token>.jpg`,
  then `attachWebPayment` → RPC `attach_web_payment` (payment status `pending` until staff tap "Bukti cocok"). Motion layer (snow, lights, Natal intro, tilt+glare, scroll reveal, fly-to-cart) lives in
  `src/components/site/SiteMotion.tsx`; pages only mark elements (`data-tilt`, `data-glare`, `data-twinkle`, `#nt-*`).
  Everything is skipped under prefers-reduced-motion. Snow follows the snow setting, independent of mode Natal (as in the prototype).
- Preorder data is loaded whole per request; revisit with pagination/server filters if orders grow to thousands.
- Brand system (redesign 2026-10): tokens in `src/app/brand.css`, base components in `src/components/brand`
  (Button/ButtonLink/IconButton, PostCard/AppCard, Chip/Tag, Field/Input, Photo/Polaroid/ArchFrame/Sticker, Awning,
  DottedPrice, Script/SectionHead, Logo, Icon). Icons = inline SVG from Material Symbols Rounded: add a name in
  `scripts/gen-icons.mjs` and run `node scripts/gen-icons.mjs`. Reference sheet at `/dev/komponen` (dev only).
  Photos from the design handoff live in `public/images` (downscaled).
- Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- PostgREST note: `recipes`↔`recipe_items` has two FKs, so embed with `recipe_items!recipe_items_recipe_id_fkey(...)`.

## Environments

- Supabase project "Mami i Patiserrie" (ref `mxkmavpebiawiknnbxam`, eu-west-1). Migrations
  20260926000001–03, 20260927000001–02 (preorder) + full DUMMY seed applied on 2026-09-27.
  20260927000003 (public site) applied on 2026-09-27. 20260928000001 (order_items.unit_cost) applied on 2026-09-27.
  20261022000001 (web checkout) + 20261022000002 (website content) applied on 2026-10-23 (partly via MCP, the rest by Alto
  in the SQL Editor because MCP calls with drop/delete/update hung; both are recorded in schema_migrations).
  20261024000001 (crew role) + 20261024000002 (team login) applied by Alto in the SQL Editor on 2026-10-24.
  New migrations: add a file in
  `supabase/migrations/` AND apply it to this project (ask Alto first).
- Vercel project `mami-i-patisserie` (team altodaphino-6734s-projects), auto-deploys `main`.
  Production domain: https://mami-i-patisserie.vercel.app (site URL falls back to VERCEL_PROJECT_PRODUCTION_URL).
  Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key), `SUPABASE_SECRET_KEY` (server only,
  PIN login + Akun tim; not set yet, see reminders).
- Users: altodaphino@gmail.com = owner (Alto). Nana/Mami accounts not created yet.

## Pending reminders for Alto (remind at the end of each phase until done)

Status 2026-09-27: Vercel secret key made "sensitive" (resolved). Items below were postponed by Alto ("nanti").

1. Website WhatsApp number: set `NEXT_PUBLIC_WHATSAPP_NUMBER` in Vercel (no number yet; WA buttons hidden until then).
   Also `NEXT_PUBLIC_INSTAGRAM` (and optionally `NEXT_PUBLIC_SITE_URL`).
2. Supabase Auth: turn off "Allow new users to sign up"; set Site URL to https://mami-i-patisserie.vercel.app.
3. Set `SUPABASE_SECRET_KEY` in Vercel (secret key; the existing `SUPABASE_Secret_Key` env can be renamed), redeploy, then in
   Lainnya → Akun tim: register the team devices, give everyone a PIN, add Nana & Mami (Owner) and the team.
4. Check the site in an incognito window; if Vercel login appears, disable Vercel Authentication (Deployment Protection).
5. Before real orders: remove DUMMY data (supabase/remove_dummy.sql, ask first), enter real products (Tampil di website),
   replace DUMMY bank/QRIS/pickup in Lainnya → Pengaturan, test one photo upload, final website copy from Nana.
   Website: real prices (then `price_pending = false`), real shipping fees (then `settings.shipping_is_sample = false`),
   QRIS image, then `settings.web_orders_open = true`. Until the stage 5 settings screen exists these are set via SQL.
6. Optional: delete the unused `SUPABASE_Secret_Key` / `SUPABASE_Publishkey` envs; Vercel Function Region → dub1;
   Supabase leaked password protection. Open question: does PBJT 10% apply to online sales?

## Decisions log

<!-- Append confirmed decisions here, with date. -->
- 2026-09-26: Repository initialized. Costing module plan approved ("setuju semua"):
  1. **Waste**: cost per piece = batch cost / (yield × (1 − waste%)). Waste reduces sellable output.
  2. **Recipe yield unit**: `pcs | porsi | g | ml`. A sub-recipe is used in other recipes in its
     yield unit (e.g. 30 g pistachio cream).
  3. **Units**: recipe item units must be in the same family as the ingredient's base unit
     (g/kg, ml/liter, pcs). No g↔ml density conversion. Eggs are bought and used per **pcs**.
  4. **Supplier products** (e.g. supplier croissant) are ingredients with category `bahan`, unit pcs.
  5. **Selling price is stored excluding PBJT.** HPP % uses the pre-tax price. PBJT 10% is a
     display option only. (Whether PBJT applies to online sales is still open. The display
     toggle works either way.)
  6. **Permissions**: `owner` and `admin` have full access. `produksi` (Mami) can read everything
     and create/edit ingredients and recipes, but cannot delete, and cannot change recipe selling
     price or target HPP. Bundles are read-only for her. `manager` is read-only for now.
  7. **Login**: email + password. No public sign-up. Accounts are created by Alto in the Supabase
     dashboard, and the role is set in `profiles`.
  8. **Default target HPP** is 35% (editable per recipe/bundle). Price rounding (Rp 500 / Rp 1.000)
     is picked on screen and defaults to Rp 1.000. It is not stored per recipe.
  9. **Bundles** have their own selling price and target HPP and appear on the summary page.
     Greeting cards are ingredients with category `kemasan`.
  10. **Supabase**: migration files live in the repo. No changes to any live project without
      Alto's permission. Tooling is npm + Vitest.
- 2026-09-26: Pack purchases: `purchase_qty` is the pack content in base units (e.g. 227 g).
  For kg/liter/pcs it is in purchase units. A new login has no role (and no access) until the owner sets one.
  When produksi duplicates a recipe, the copy gets no selling price and target 35%.

- 2026-09-27: **Preorder module** plan approved ("gas dl aja yg mnrt km ok" = use Claude's recommendations):
  1. `products` link to exactly one recipe or bundle, with `units_per_product` (e.g. risol frozen isi 10).
  2. Product price is its own field. Campaigns may set `price_override` per product. Product HPP is shown from costing.
  3. Capacity is weekly per product, Mon–Sun (Asia/Jakarta), based on fulfill date. Non-cancelled orders count.
     Bundles do NOT consume their components' capacity. Hard block when full; owner raises capacity instead.
  4. Production date = fulfill date. The schedule also expands bundles into recipes and sub-recipes.
  5. DP default 50% (global setting), overridable per campaign and per order. The suggested DP rounds up to Rp 1.000.
  6. Shipping fee & discount are manual per order: total = subtotal + shipping − discount.
  7. Multiple payments per order, each with its own proof photo. When paid ≥ DP and status is baru/menunggu_dp,
     status auto-advances to dp_diterima. Other status changes are manual.
  8. produksi can create/edit orders, customers and payments, and cancel via status (no deletes). Products,
     campaigns and settings are read-only for produksi. The revenue dashboard is owner/admin only. manager is read-only.
  9. `show_on_website` is stored only; the public catalog/checkout comes in the website phase.
  10. Order number `MIP-0001` (global sequence).
  11. Bank/QRIS details live in a single-row `settings` table, editable by owner/admin (seed = DUMMY placeholders).
- 2026-09-27: **Public website v1** plan approved ("setuju semua"):
  1. New `products.web_category`: kue_kering, frozen, kue_basah, pastry, minuman, hampers (set in the Produk form).
  2. "Kuota minggu ini penuh" = current Mon–Sun week (Asia/Jakarta). The add button stays enabled; admin sets the date.
  3. WhatsApp order message: items, qty, total, desired date, optional name, ambil/kirim, and a note
     that the final price & shipping are confirmed by admin.
  4. Items added from the Hampers page use the campaign price, and the campaign name goes in the message.
  5. DUMMY products are hidden on the public site unless `NEXT_PUBLIC_SHOW_DUMMY=1` (for previews).
  6. Contact/story copy lives in `src/content/site.ts`, with PLACEHOLDERs clearly marked until Alto/Nana provide it.
     WhatsApp number via `NEXT_PUBLIC_WHATSAPP_NUMBER`, Instagram via `NEXT_PUBLIC_INSTAGRAM`, and site URL via `NEXT_PUBLIC_SITE_URL`.
  7. Fonts: superseded by the 2026-10 redesign (Libre Baskerville + Instrument Sans + Kalam).
  8. Public data only through read-only SECURITY DEFINER RPCs (`public_catalog`, `public_campaigns`) granted to anon;
     base tables stay closed to anon. Brand colors live in `src/app/brand.css` (see palette decision below).
- 2026-09-27: **Brand palette final** (from Alto/Nana), priority order: 1. Butter yellow `#F5E8AA` (~60%),
  2. Espresso `#3E2723` (~25%), 3. Pistachio `#A2A672` (Pantone 5777 C, sampled; ~10%), 4. French wine `#AA1945`
  (~5%, CTAs/alerts only). Only these four colors are allowed, on the website AND the internal app (globals.css maps
  onto brand.css). Tints/shades are derived with color-mix. Text on pistachio fills is always espresso (butter on
  pistachio fails contrast). HPP/status: under target = pistachio fill, over target = wine fill.
- 2026-09-27: **Shopping list (#7) + gross profit (#8)** plan approved ("setuju semua"):
  1. HPP snapshot per order item: `order_items.unit_cost` (HPP per product unit), computed in `saveOrder` with the
     TS costing functions. On edit, products already on the order keep their snapshot. Items without a snapshot
     (older orders) use the current HPP and are labelled as an estimate (no SQL backfill, to avoid duplicating
     the costing logic in SQL).
  2. Shopping list quantities: exact proportional need by default; toggle "Bulatkan ke batch penuh" rounds each recipe
     up to whole batches over the whole range (sub-recipes scale from the rounded batches). Packs to buy = ceil.
  3. Orders included: all non-cancelled in the date range (default next 7 days); toggle "Hanya yang sudah DP"
     (status past DP, or payments ≥ DP).
  4. produksi (Mami) sees estimated costs in the shopping list; profit (dashboard, order detail, CSV columns) is owner/admin.
  5. Gross profit = (subtotal − discount) − HPP; shipping excluded. Counts all non-cancelled orders. Per-product
     profit is before order discounts. "Sudah dibeli" ticks live in localStorage per device/range.
- 2026-10-22: **Full redesign from the design handoff** ("Redesign web mami keseluruhan", docs: README/WEB/APP/DATA/
  KEPUTUSAN/CHECKLIST). Alto asked to rebuild it stage by stage per CHECKLIST, reviewing each stage at 360/768/1280.
  Stage 1 done: fonts Libre Baskerville 700 + italic 400 (headings), Instrument Sans 400–700 (text/UI), Kalam 400
  (handwritten labels), self-hosted via @fontsource in the root layout (web + app). Natal green `#2d4a3a` is allowed
  ONLY for the Christmas campaign; oak `#b9864f/#9c6b3f/#7a5230` only for the Etalase facade. App UI pattern:
  radius 6px, 1.5px lines, card bg butter-50. Web: pill CTAs (min 52px), postcard cards (radius 0).
- 2026-10-22 (Alto): hero Beranda = "sekarang" (arched frame + sticker 24); Etalase/samping/masuk are archived, not built.
  Mode Natal = takeover as in the prototype: /, /menu, /hampers, /tentang, /faq show the Natal page; nav Hampers (#paket) ·
  Cara pesan (#cara) · FAQ (#tanya) · Kontak; /kontak and /keranjang stay normal. Normal pages are built too.
  Rule: when docs and prototype differ, the prototype wins; ask when unsure.
- 2026-10-23: **Stage 4 (Supabase for the website)**, Alto: "atur aja / gas" (Claude's recommendations):
  1. POS stays Majoo. No transactional stock; kitchen stock later only as a manual count + min stock (stage 5).
  2. Keep Supabase Auth (email+password); PIN/role changes come with the app in stage 5.
  3. Extend existing tables instead of a new schema. Stage 4 = website data only; app tables come in stage 5.
  4. Settings flags: `mode_natal` (takeover), `snow_mode` (hero/semua/mati), `web_orders_open` (checkout accepts orders;
     false until real prices/fees/bank/QRIS), `shipping_is_sample`, `dp_round` (Rp 50.000), `min_lead_days` (2),
     `pay_timeout_min` (60). Default DP is 40%: DP = 40% of total rounded UP to Rp 50.000, capped at the total.
  5. Web orders: channel `web`, status `menunggu_dp`, `expires_at` = now + 60 min; unpaid ones are cancelled lazily by
     `cancel_expired_web_orders()` on the next web order (scheduled job in stage 6). Proof → payment `pending`; only
     `matched` payments count towards amount_paid. Payments recorded in the app are `matched` right away.
  6. Quotas: weekly capacity (existing) + `products.daily_quota` (hampers) + `campaigns.quota` (boxes per campaign).
  7. Flat shipping fee per area (`shipping_areas`, SAMPLE fees). Prices from the prototype are stored with
     `price_pending = true`: regular products show "harga menyusul"; campaign packages show their (sample) price
     and checkout says "Harga masih contoh, belum final".
- 2026-10-24: **Stage 5 (internal app)** plan approved: sub-stages 5a login/roles/nav → 5b Beranda per person, Order,
  Produksi (+ manual stock count, min stock, waste) → 5c Persetujuan + Target → 5d Tim (shift, absen, izin) → 5e gaji &
  slip → 5f Kafe (Majoo) → 5g Laporan → 5h Alat, Konten, Legal; review at 360/768/1280 after each. Alto's answers:
  1. PIN login only on devices registered once by Alto (email + password); 5 wrong PINs lock 15 minutes.
  2. Roles: keep the DB enum, add `crew`; Nana and Mami are `admin` ("Owner"), pastry chef `produksi` (prototype wins).
  3. Majoo export: no sample file yet, so 5f starts with manual entry + attached file; parsing comes when a file exists.
  4. Order of sub-stages left to Claude; migrations go live after local tests (SQL Editor file when MCP can't run them).
- NOTE: never write inside the `<!-- BEGIN/END:nextjs-agent-rules -->` block below; `next dev` rewrites it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
