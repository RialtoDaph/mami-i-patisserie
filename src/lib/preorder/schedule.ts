import { toTargetQuantity, sellableQuantity, type Bundle, type Recipe, type YieldUnit } from "../costing";
import { addDays } from "./dates";
import type { Order, Product } from "./types";

export interface ScheduleProductLine {
  productId: string;
  name: string;
  qty: number;
}

export interface ScheduleRecipeLine {
  recipeId: string;
  name: string;
  /** Quantity needed in the recipe's yield unit. */
  qty: number;
  unit: YieldUnit;
  /** Number of batches needed (after waste). */
  batches: number;
  /** True when needed only as an ingredient of another recipe. */
  isSubRecipe: boolean;
}

export interface ScheduleDay {
  date: string;
  orderCount: number;
  products: ScheduleProductLine[];
  recipes: ScheduleRecipeLine[];
}

/** Topological order (parents before sub-recipes) of recipes reachable from `roots`. */
function parentsFirst(roots: string[], recipes: Map<string, Recipe>): string[] {
  const visited = new Set<string>();
  const post: string[] = [];
  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);
    for (const it of recipes.get(id)?.items ?? []) if (it.source.kind === "recipe") visit(it.source.id);
    post.push(id);
  };
  roots.forEach(visit);
  return post.reverse();
}

export interface NeedsOptions {
  /** Round each recipe up to whole batches (sub-recipes are then scaled from the rounded batches). */
  roundBatches?: boolean;
}

/**
 * Recipe quantities needed to make the given products, expanding bundles into their
 * recipes and recipes into their sub-recipes (scaled by batches, including waste).
 */
export function recipeNeeds(
  productQty: Map<string, number>,
  products: Product[],
  recipes: Recipe[],
  bundles: Bundle[],
  options: NeedsOptions = {},
): ScheduleRecipeLine[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const need = new Map<string, number>();
  const direct = new Set<string>();
  const add = (id: string, q: number) => need.set(id, (need.get(id) ?? 0) + q);

  for (const [productId, qty] of productQty) {
    const p = products.find((x) => x.id === productId);
    if (!p) continue;
    if (p.recipeId && recipeMap.has(p.recipeId)) {
      add(p.recipeId, qty * p.unitsPerProduct);
      direct.add(p.recipeId);
    } else if (p.bundleId) {
      const b = bundles.find((x) => x.id === p.bundleId);
      for (const it of b?.items ?? []) {
        const r = it.source.kind === "recipe" ? recipeMap.get(it.source.id) : undefined;
        if (!r) continue;
        add(r.id, qty * p.unitsPerProduct * toTargetQuantity(it.quantity, it.unit, r.yieldUnit));
        direct.add(r.id);
      }
    }
  }

  const lines: ScheduleRecipeLine[] = [];
  for (const id of parentsFirst([...need.keys()], recipeMap)) {
    const r = recipeMap.get(id)!;
    const q = need.get(id) ?? 0;
    if (q <= 0) continue;
    const exact = q / sellableQuantity(r.yieldQty, r.wastePct);
    // Tolerance so float noise (e.g. 2.0000000001) does not add a whole batch.
    const batches = options.roundBatches ? Math.ceil(exact - 1e-9) : exact;
    for (const it of r.items) {
      if (it.source.kind !== "recipe") continue;
      const sub = recipeMap.get(it.source.id);
      if (sub) add(sub.id, batches * toTargetQuantity(it.quantity, it.unit, sub.yieldUnit));
    }
    lines.push({ recipeId: id, name: r.name, qty: q, unit: r.yieldUnit, batches, isSubRecipe: !direct.has(id) });
  }
  return lines;
}

/** Per-day production list (fulfill date = production date), cancelled orders excluded. */
export function productionSchedule(
  orders: Order[],
  products: Product[],
  recipes: Recipe[],
  bundles: Bundle[],
  fromDate: string,
  days: number,
): ScheduleDay[] {
  const result: ScheduleDay[] = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(fromDate, d);
    const dayOrders = orders.filter((o) => o.fulfillDate === date && o.status !== "batal");
    const productQty = new Map<string, number>();
    for (const o of dayOrders) for (const i of o.items) productQty.set(i.productId, (productQty.get(i.productId) ?? 0) + i.qty);
    result.push({
      date,
      orderCount: dayOrders.length,
      products: [...productQty]
        .map(([productId, qty]) => ({ productId, qty, name: products.find((p) => p.id === productId)?.name ?? "?" }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      recipes: recipeNeeds(productQty, products, recipes, bundles),
    });
  }
  return result;
}
