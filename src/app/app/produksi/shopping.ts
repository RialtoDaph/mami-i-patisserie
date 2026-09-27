import "server-only";
import type { FullCostingData } from "@/lib/data";
import type { PreorderData } from "@/lib/preorderData";
import { groupShopping, ingredientNeeds, ordersInRange, productQuantities, shoppingRows } from "@/lib/preorder";
import type { ShoppingParams } from "@/lib/shoppingParams";

/** Shopping list for the selected range (used by the page and the CSV export). */
export function buildShoppingList(pre: PreorderData, costing: FullCostingData, p: ShoppingParams) {
  const orders = ordersInRange(pre.orders, p.from, p.to, p.onlyPaidDp);
  const productQty = productQuantities(orders);
  const needs = ingredientNeeds(productQty, pre.products, costing.ingredients, costing.recipes, costing.bundles, {
    roundBatches: p.roundBatches,
  });
  const rows = shoppingRows(needs, costing.ingredients);
  return {
    orderCount: orders.length,
    products: [...productQty]
      .map(([id, qty]) => ({ id, qty, name: pre.products.find((x) => x.id === id)?.name ?? "?" }))
      .sort((a, b) => b.qty - a.qty),
    rows,
    groups: groupShopping(rows),
    totalBuy: rows.reduce((s, r) => s + r.buyCost, 0),
    totalUse: rows.reduce((s, r) => s + r.useCost, 0),
  };
}
