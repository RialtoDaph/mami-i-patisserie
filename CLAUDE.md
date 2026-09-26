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

## Decisions log

<!-- Append confirmed decisions here, with date. -->
- 2026-09-26: Repository initialized; costing module plan pending approval.
