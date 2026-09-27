import {
  pricePerBaseUnit, purchaseBaseQuantity, toTargetQuantity,
  type BaseUnit, type Bundle, type Ingredient, type IngredientCategory, type PurchaseUnit, type Recipe,
} from "../costing";
import { recipeNeeds, type NeedsOptions } from "./schedule";
import type { Order, OrderStatus, Product } from "./types";

const DP_DONE: OrderStatus[] = ["dp_diterima", "diproduksi", "siap", "dikirim", "selesai"];

/** True when the order's DP is in: status already past DP, or payments cover the DP. */
export function hasPaidDp(o: Pick<Order, "status" | "dpAmount" | "amountPaid">): boolean {
  if (o.status === "batal") return false;
  return DP_DONE.includes(o.status) || (o.amountPaid > 0 && o.amountPaid >= o.dpAmount);
}

/** Non-cancelled orders with a fulfill date in [from, to] (inclusive), optionally only those with DP paid. */
export function ordersInRange(orders: Order[], from: string, to: string, onlyPaidDp = false): Order[] {
  return orders.filter(
    (o) => o.status !== "batal" && o.fulfillDate >= from && o.fulfillDate <= to && (!onlyPaidDp || hasPaidDp(o)),
  );
}

export function productQuantities(orders: Order[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of orders) for (const i of o.items) m.set(i.productId, (m.get(i.productId) ?? 0) + i.qty);
  return m;
}

/**
 * Raw ingredient/packaging quantities (in each ingredient's base unit) needed for the given
 * products: recipes expanded through sub-recipes, plus ingredients packed directly in bundles.
 */
export function ingredientNeeds(
  productQty: Map<string, number>,
  products: Product[],
  ingredients: Ingredient[],
  recipes: Recipe[],
  bundles: Bundle[],
  options: NeedsOptions = {},
): Map<string, number> {
  const ingMap = new Map(ingredients.map((i) => [i.id, i]));
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const need = new Map<string, number>();
  const add = (id: string, qty: number, unit: Parameters<typeof toTargetQuantity>[1]) => {
    const ing = ingMap.get(id);
    if (!ing) return;
    need.set(id, (need.get(id) ?? 0) + toTargetQuantity(qty, unit, ing.baseUnit));
  };

  for (const line of recipeNeeds(productQty, products, recipes, bundles, options)) {
    for (const it of recipeMap.get(line.recipeId)?.items ?? []) {
      if (it.source.kind === "ingredient") add(it.source.id, line.batches * it.quantity, it.unit);
    }
  }
  for (const [productId, qty] of productQty) {
    const p = products.find((x) => x.id === productId);
    const b = p?.bundleId ? bundles.find((x) => x.id === p.bundleId) : undefined;
    for (const it of b?.items ?? []) {
      if (it.source.kind === "ingredient") add(it.source.id, qty * p!.unitsPerProduct * it.quantity, it.unit);
    }
  }
  return need;
}

export interface ShoppingRow {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  supplier: string | null;
  /** Needed quantity in the base unit (g, ml, pcs). */
  needQty: number;
  baseUnit: BaseUnit;
  purchaseUnit: PurchaseUnit;
  /** Base units in one purchase (e.g. 1000 g per kg, 227 g per pack). */
  packSize: number;
  /** Whole purchase units to buy. */
  packs: number;
  /** Cost of the packs to buy. */
  buyCost: number;
  /** Cost of only what is used. */
  useCost: number;
}

export function shoppingRows(needs: Map<string, number>, ingredients: (Ingredient & { supplier?: string | null })[]): ShoppingRow[] {
  const rows: ShoppingRow[] = [];
  for (const ing of ingredients) {
    const needQty = needs.get(ing.id) ?? 0;
    if (needQty <= 0) continue;
    const packSize = purchaseBaseQuantity(ing.purchaseUnit, ing.purchaseQty);
    const packs = Math.ceil(needQty / packSize - 1e-9);
    rows.push({
      ingredientId: ing.id, name: ing.name, category: ing.category, supplier: ing.supplier ?? null,
      needQty, baseUnit: ing.baseUnit, purchaseUnit: ing.purchaseUnit, packSize, packs,
      buyCost: packs * ing.purchasePrice,
      useCost: needQty * pricePerBaseUnit(ing),
    });
  }
  return rows;
}

export interface ShoppingGroup {
  category: IngredientCategory;
  suppliers: { supplier: string | null; rows: ShoppingRow[] }[];
}

/** Bahan first, then kemasan; suppliers A–Z with "no supplier" last; rows A–Z. */
export function groupShopping(rows: ShoppingRow[]): ShoppingGroup[] {
  const groups: ShoppingGroup[] = [];
  for (const category of ["bahan", "kemasan"] as IngredientCategory[]) {
    const inCat = rows.filter((r) => r.category === category);
    if (!inCat.length) continue;
    const bySupplier = new Map<string | null, ShoppingRow[]>();
    for (const r of inCat) {
      const key = r.supplier?.trim() || null;
      bySupplier.set(key, [...(bySupplier.get(key) ?? []), r]);
    }
    groups.push({
      category,
      suppliers: [...bySupplier]
        .sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)))
        .map(([supplier, list]) => ({ supplier, rows: list.sort((a, b) => a.name.localeCompare(b.name)) })),
    });
  }
  return groups;
}

const fmt = (n: number, d: number) => {
  const f = 10 ** d;
  const r = Math.round(n * f) / f;
  const [i, frac = ""] = r.toFixed(d).split(".");
  const t = frac.replace(/0+$/, "");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (t ? "," + t : "");
};

/** Needed quantity, e.g. "350 g", "1,25 kg", "5,3 pcs". */
export function needLabel(qty: number, baseUnit: BaseUnit): string {
  if (baseUnit === "g" || baseUnit === "ml") {
    const big = baseUnit === "g" ? "kg" : "liter";
    return qty >= 1000 ? `${fmt(qty / 1000, 2)} ${big}` : `${fmt(qty, 0)} ${baseUnit}`;
  }
  return `${fmt(qty, 1)} ${baseUnit}`;
}

/** What to buy, e.g. "2 kg", "1 × 2 liter", "3 pcs", "1 × 30 pcs", "2 pack @227 g". */
export function buyLabel(row: Pick<ShoppingRow, "packs" | "packSize" | "purchaseUnit" | "baseUnit">): string {
  const { packs, packSize, purchaseUnit, baseUnit } = row;
  if (purchaseUnit === "pack") return `${packs} pack @${fmt(packSize, 0)} ${baseUnit}`;
  const perPurchase = purchaseUnit === "pcs" ? packSize : packSize / 1000;
  return perPurchase === 1 ? `${packs} ${purchaseUnit}` : `${packs} × ${fmt(perPurchase, 2)} ${purchaseUnit}`;
}

export const CATEGORY_TITLE: Record<IngredientCategory, string> = { bahan: "Bahan", kemasan: "Kemasan" };

/** Plain-text list for WhatsApp. Items in `bought` are marked as already bought. */
export function shoppingMessage(groups: ShoppingGroup[], title: string, bought: Set<string> = new Set()): string {
  const lines = [`*${title}*`];
  for (const g of groups) {
    lines.push("", `*${CATEGORY_TITLE[g.category]}*`);
    for (const s of g.suppliers) {
      lines.push(`_${s.supplier ?? "Supplier belum diisi"}_`);
      for (const r of s.rows) {
        lines.push(`${bought.has(r.ingredientId) ? "✅" : "▫️"} ${r.name}: ${buyLabel(r)} (butuh ${needLabel(r.needQty, r.baseUnit)})`);
      }
    }
  }
  return lines.join("\n");
}
