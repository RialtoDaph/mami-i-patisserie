import { computeBundleCost } from "./bundle";
import { computeRecipeCost, createContext, type CostContext } from "./recipe";
import {
  grossMargin,
  hppPct,
  hppStatus,
  suggestedPrice,
  withPbjt,
  type HppStatus,
  type RoundingStep,
} from "./pricing";
import type { CostingData, Ingredient, ItemUnit, RecipeCategory, YieldUnit } from "./types";

export interface SummaryOptions {
  roundingStep: RoundingStep;
  /** Show selling/suggested prices including PBJT 10%. HPP always uses the pre-tax price. */
  includePbjt: boolean;
  includeInactive?: boolean;
}

export interface SummaryRow {
  kind: "recipe" | "bundle";
  id: string;
  name: string;
  category: RecipeCategory | "paket";
  unit: YieldUnit | ItemUnit;
  isActive: boolean;
  /** Cost per piece (or per bundle). Null if it could not be computed. */
  cost: number | null;
  /** Pre-tax selling price as stored. */
  sellingPrice: number | null;
  /** Selling price as displayed (with PBJT if chosen). */
  displayPrice: number | null;
  hppPct: number | null;
  targetHppPct: number;
  status: HppStatus;
  /** Suggested price as displayed (with PBJT if chosen). */
  suggestedPrice: number | null;
  margin: number | null;
  error: string | null;
}

function row(
  base: Omit<SummaryRow, "displayPrice" | "hppPct" | "status" | "suggestedPrice" | "margin">,
  opts: SummaryOptions,
): SummaryRow {
  const display = (p: number | null) => (p == null ? null : opts.includePbjt ? withPbjt(p) : p);
  if (base.cost == null) {
    return { ...base, displayPrice: display(base.sellingPrice), hppPct: null, status: "unknown", suggestedPrice: null, margin: null };
  }
  const hpp = hppPct(base.cost, base.sellingPrice);
  return {
    ...base,
    displayPrice: display(base.sellingPrice),
    hppPct: hpp,
    status: hppStatus(hpp, base.targetHppPct),
    suggestedPrice: display(suggestedPrice(base.cost, base.targetHppPct, opts.roundingStep)),
    margin: grossMargin(base.cost, base.sellingPrice),
  };
}

function safe<T>(fn: () => T): { value: T | null; error: string | null } {
  try {
    return { value: fn(), error: null };
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/** One row per sellable product (recipes except sub-recipes, plus bundles). */
export function buildSummary(data: CostingData, opts: SummaryOptions): SummaryRow[] {
  const ctx: CostContext = createContext(data.ingredients, data.recipes);
  const rows: SummaryRow[] = [];

  for (const r of data.recipes) {
    if (r.category === "sub_resep") continue;
    if (!r.isActive && !opts.includeInactive) continue;
    const res = safe(() => computeRecipeCost(ctx, r.id).costPerUnit);
    rows.push(
      row(
        {
          kind: "recipe", id: r.id, name: r.name, category: r.category, unit: r.yieldUnit,
          isActive: r.isActive, cost: res.value, sellingPrice: r.sellingPrice,
          targetHppPct: r.targetHppPct, error: res.error,
        },
        opts,
      ),
    );
  }

  for (const b of data.bundles) {
    if (!b.isActive && !opts.includeInactive) continue;
    const res = safe(() => computeBundleCost(ctx, b).cost);
    rows.push(
      row(
        {
          kind: "bundle", id: b.id, name: b.name, category: "paket", unit: "pcs",
          isActive: b.isActive, cost: res.value, sellingPrice: b.sellingPrice,
          targetHppPct: b.targetHppPct, error: res.error,
        },
        opts,
      ),
    );
  }
  return rows;
}

export interface PriceImpactRow {
  kind: SummaryRow["kind"];
  id: string;
  name: string;
  costBefore: number;
  costAfter: number;
  hppBefore: number | null;
  hppAfter: number | null;
  targetHppPct: number;
  /** True if it was at/below target (or unknown) before and is above target after. */
  newlyOver: boolean;
}

/**
 * Products whose cost changes when an ingredient is replaced by `updated`, and whether
 * they cross the target HPP. Sorted: newly over target first, then by HPP after.
 */
export function priceImpact(data: CostingData, updated: Ingredient): PriceImpactRow[] {
  const opts: SummaryOptions = { roundingStep: 1000, includePbjt: false, includeInactive: true };
  const before = buildSummary(data, opts);
  const after = buildSummary(
    { ...data, ingredients: data.ingredients.map((i) => (i.id === updated.id ? updated : i)) },
    opts,
  );
  const afterById = new Map(after.map((r) => [`${r.kind}:${r.id}`, r]));

  const result: PriceImpactRow[] = [];
  for (const b of before) {
    const a = afterById.get(`${b.kind}:${b.id}`);
    if (!a || b.cost == null || a.cost == null) continue;
    if (Math.abs(a.cost - b.cost) < 1e-9) continue;
    result.push({
      kind: b.kind, id: b.id, name: b.name,
      costBefore: b.cost, costAfter: a.cost,
      hppBefore: b.hppPct, hppAfter: a.hppPct,
      targetHppPct: b.targetHppPct,
      newlyOver: b.status !== "over" && a.status === "over",
    });
  }
  return result.sort(
    (x, y) => Number(y.newlyOver) - Number(x.newlyOver) || (y.hppAfter ?? -1) - (x.hppAfter ?? -1),
  );
}
