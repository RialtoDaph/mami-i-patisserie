# CLAUDE.md — Mami I Pâtisserie

Context for every Claude Code session working on this repository. Read this first.

## Business

- **Mami I Pâtisserie**: bakery cafe in Bandung, Indonesia. Physical outlet opens **October 2027**.
- From **January 2027** it sells online before the outlet opens: cookie hampers (kue kering),
  frozen risol & kroket, kue basah, and the **Blessings Box**.
- This repo is one codebase for both the **public website** (`/`) and the **internal app**
  (`/app`, login required).

## Team & roles

| Person | Job | Role (`app_role`) | Notes |
|---|---|---|---|
| Alto | Owner, lives in Germany, runs the system & finances | `owner` | |
| Nana | Brand & marketing | `admin` | |
| Mami | Production in Bandung | `produksi` | Uses a phone, not very technical. UI must work for her without long training. |
| (future) | Outlet manager | `manager` | Role must exist now, not used yet. |

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
- Pages: `/app` summary, `/app/bahan`, `/app/resep`, `/app/paket`, `/app/ringkasan/export` (CSV), `/login`.
- Checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- PostgREST note: `recipes`↔`recipe_items` has two FKs, so embed with `recipe_items!recipe_items_recipe_id_fkey(...)`.

## Environments

- Supabase project "Mami i Patiserrie" (ref `mxkmavpebiawiknnbxam`, eu-west-1). Migrations
  20260926000001–03 + DUMMY seed applied on 2026-09-27. New migrations: add a file in
  `supabase/migrations/` AND apply it to this project (ask Alto first).
- Vercel project `mami-i-patisserie` (team altodaphino-6734s-projects), auto-deploys `main`.
  Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key).
- Users: altodaphino@gmail.com = owner (Alto). Nana/Mami accounts not created yet.

## Pending reminders for Alto (remind at the end of each phase until done)

1. Delete `SUPABASE_Secret_Key` (and unused `SUPABASE_Publishkey`) from Vercel env vars.
2. Supabase Auth: turn off "Allow new users to sign up"; set Site URL to the Vercel URL.
3. Create Nana (admin) and Mami (produksi) accounts, then set roles via SQL.
4. Optional: Vercel Function Region → Dublin (dub1), close to Supabase eu-west-1.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
