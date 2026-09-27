import { describe, expect, it } from "vitest";
import { productionSchedule, recipeNeeds } from "./schedule";
import { order, products } from "./fixtures";
import { data } from "../costing/fixtures";

describe("recipeNeeds", () => {
  it("multiplies units per product and expands bundles and sub-recipes", () => {
    // 2x risol isi 10 = 20 risol; 1 box = 6 risol + 2 croissant; 3 croissant.
    const lines = recipeNeeds(new Map([["risolFrozen", 2], ["box", 1], ["croissant", 3]]), products, data.recipes, data.bundles);
    const by = Object.fromEntries(lines.map((l) => [l.recipeId, l]));
    expect(by.risol.qty).toBe(26);
    expect(by.risol.batches).toBeCloseTo(26 / 28.5);
    expect(by.pcroissant.qty).toBe(5);
    expect(by.pcroissant.batches).toBeCloseTo(0.5);
    // Croissant batch (10 pcs) uses 250 g cream → 5 croissants need 125 g.
    expect(by.pcream.qty).toBeCloseTo(125);
    expect(by.pcream.isSubRecipe).toBe(true);
    expect(by.risol.isSubRecipe).toBe(false);
    // Parents come before their sub-recipes.
    expect(lines.findIndex((l) => l.recipeId === "pcroissant")).toBeLessThan(lines.findIndex((l) => l.recipeId === "pcream"));
  });
});

describe("productionSchedule", () => {
  it("groups non-cancelled orders by fulfill date", () => {
    const orders = [
      order({ fulfillDate: "2026-10-01", items: [{ productId: "risolFrozen", qty: 2, unitPrice: 1 }] }),
      order({ fulfillDate: "2026-10-01", items: [{ productId: "risolFrozen", qty: 1, unitPrice: 1 }, { productId: "box", qty: 1, unitPrice: 1 }] }),
      order({ fulfillDate: "2026-10-01", status: "batal", items: [{ productId: "risolFrozen", qty: 9, unitPrice: 1 }] }),
      order({ fulfillDate: "2026-10-03", items: [{ productId: "croissant", qty: 4, unitPrice: 1 }] }),
    ];
    const days = productionSchedule(orders, products, data.recipes, data.bundles, "2026-10-01", 3);
    expect(days.map((d) => d.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(days[0].orderCount).toBe(2);
    expect(days[0].products).toEqual([
      { productId: "box", name: "Blessings Box", qty: 1 },
      { productId: "risolFrozen", name: "Risol Frozen isi 10", qty: 3 },
    ]);
    expect(days[0].recipes.find((r) => r.recipeId === "risol")!.qty).toBe(36);
    expect(days[1].products).toEqual([]);
    expect(days[2].recipes.map((r) => r.recipeId)).toEqual(["pcroissant", "pcream"]);
  });
});
