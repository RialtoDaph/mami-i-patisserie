import { computeBundleCost, computeRecipeCost, createContext, type CostingData } from "../costing";
import type { Order, Product } from "./types";

/** Current HPP of one product unit (recipe cost × units per product, or bundle cost); null if it cannot be computed. */
export function productCosts(products: Product[], costing: CostingData): Map<string, number | null> {
  const ctx = createContext(costing.ingredients, costing.recipes);
  const out = new Map<string, number | null>();
  for (const p of products) {
    let cost: number | null = null;
    try {
      if (p.recipeId) cost = computeRecipeCost(ctx, p.recipeId).costPerUnit * p.unitsPerProduct;
      else if (p.bundleId) {
        const b = costing.bundles.find((x) => x.id === p.bundleId);
        if (b) cost = computeBundleCost(ctx, b).cost * p.unitsPerProduct;
      }
    } catch {
      cost = null;
    }
    out.set(p.id, cost == null ? null : Math.round(cost));
  }
  return out;
}

export interface ProfitLine {
  /** Sales excluding shipping, after discount. */
  revenue: number;
  hpp: number;
  profit: number;
  /** Profit / revenue × 100; null when revenue is 0. */
  marginPct: number | null;
  /** Items whose HPP was not stored and uses the current HPP. */
  estimatedItems: number;
  /** Items whose HPP is unknown (counted as 0). */
  missingItems: number;
}

const margin = (profit: number, revenue: number) => (revenue > 0 ? (profit / revenue) * 100 : null);

/** HPP of one order item: the stored snapshot, else the current HPP. */
function itemCost(unitCost: number | null | undefined, productId: string, current: Map<string, number | null>) {
  if (unitCost != null) return { cost: unitCost, estimated: false, missing: false };
  const c = current.get(productId);
  return c == null ? { cost: 0, estimated: false, missing: true } : { cost: c, estimated: true, missing: false };
}

/** Gross profit = (subtotal − discount) − HPP. Shipping is a pass-through and excluded. */
export function orderProfit(order: Order, current: Map<string, number | null>): ProfitLine {
  let hpp = 0;
  let estimatedItems = 0;
  let missingItems = 0;
  for (const i of order.items) {
    const c = itemCost(i.unitCost, i.productId, current);
    hpp += i.qty * c.cost;
    if (c.estimated) estimatedItems++;
    if (c.missing) missingItems++;
  }
  const revenue = order.subtotal - order.discount;
  const profit = revenue - hpp;
  return { revenue, hpp, profit, marginPct: margin(profit, revenue), estimatedItems, missingItems };
}

export interface ProductProfit {
  productId: string;
  name: string;
  qty: number;
  /** qty × unit price (order discounts are not split per product). */
  revenue: number;
  hpp: number;
  profit: number;
  marginPct: number | null;
}

export interface ProfitStats extends ProfitLine {
  byProduct: ProductProfit[];
}

/** Gross profit over all non-cancelled orders, in total and per product. */
export function profitStats(orders: Order[], products: Product[], current: Map<string, number | null>): ProfitStats {
  const active = orders.filter((o) => o.status !== "batal");
  const total: ProfitLine = { revenue: 0, hpp: 0, profit: 0, marginPct: null, estimatedItems: 0, missingItems: 0 };
  const byProduct = new Map<string, { qty: number; revenue: number; hpp: number }>();
  for (const o of active) {
    const p = orderProfit(o, current);
    total.revenue += p.revenue;
    total.hpp += p.hpp;
    total.estimatedItems += p.estimatedItems;
    total.missingItems += p.missingItems;
    for (const i of o.items) {
      const a = byProduct.get(i.productId) ?? { qty: 0, revenue: 0, hpp: 0 };
      a.qty += i.qty;
      a.revenue += i.qty * i.unitPrice;
      a.hpp += i.qty * itemCost(i.unitCost, i.productId, current).cost;
      byProduct.set(i.productId, a);
    }
  }
  total.profit = total.revenue - total.hpp;
  total.marginPct = margin(total.profit, total.revenue);
  return {
    ...total,
    byProduct: [...byProduct]
      .map(([productId, a]) => ({
        productId, name: products.find((p) => p.id === productId)?.name ?? "?", ...a,
        profit: a.revenue - a.hpp, marginPct: margin(a.revenue - a.hpp, a.revenue),
      }))
      .sort((a, b) => b.profit - a.profit),
  };
}
