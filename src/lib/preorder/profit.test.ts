import { describe, expect, it } from "vitest";
import { orderProfit, productCosts, profitStats } from "./profit";
import { order, products } from "./fixtures";
import { BLESSINGS_COST, CROISSANT_PER_PCS, RISOL_PER_PCS, data } from "../costing/fixtures";

const current = productCosts(products, data);

describe("productCosts", () => {
  it("uses recipe cost × units per product, or bundle cost", () => {
    expect(current.get("risolFrozen")).toBe(Math.round(RISOL_PER_PCS * 10));
    expect(current.get("croissant")).toBe(Math.round(CROISSANT_PER_PCS));
    expect(current.get("box")).toBe(Math.round(BLESSINGS_COST));
  });

  it("returns null when the cost cannot be computed", () => {
    const broken = { ...products[0], id: "x", recipeId: "missing" };
    expect(productCosts([broken], data).get("x")).toBeNull();
  });
});

describe("orderProfit", () => {
  it("excludes shipping, subtracts discount, prefers the stored HPP", () => {
    const o = order({
      fulfillDate: "2026-10-01", shippingFee: 25000, discount: 8000,
      items: [
        { productId: "risolFrozen", qty: 2, unitPrice: 75000, unitCost: 20000 },
        { productId: "croissant", qty: 1, unitPrice: 58000 },
      ],
    });
    const p = orderProfit(o, current);
    expect(p.revenue).toBe(200000);
    expect(p.hpp).toBe(40000 + Math.round(CROISSANT_PER_PCS));
    expect(p.profit).toBe(200000 - p.hpp);
    expect(p.marginPct).toBeCloseTo((p.profit / 200000) * 100);
    expect(p.estimatedItems).toBe(1);
    expect(p.missingItems).toBe(0);
  });

  it("counts unknown costs as missing", () => {
    const p = orderProfit(order({ fulfillDate: "2026-10-01", items: [{ productId: "nope", qty: 1, unitPrice: 1000 }] }), current);
    expect(p).toMatchObject({ hpp: 0, profit: 1000, missingItems: 1 });
  });
});

describe("profitStats", () => {
  it("sums non-cancelled orders and splits per product", () => {
    const orders = [
      order({ fulfillDate: "2026-10-01", discount: 5000, items: [{ productId: "croissant", qty: 2, unitPrice: 58000, unitCost: 20000 }] }),
      order({ fulfillDate: "2026-10-02", items: [{ productId: "croissant", qty: 1, unitPrice: 58000, unitCost: 21000 }, { productId: "box", qty: 1, unitPrice: 250000, unitCost: 100000 }] }),
      order({ fulfillDate: "2026-10-03", status: "batal", items: [{ productId: "box", qty: 5, unitPrice: 250000, unitCost: 100000 }] }),
    ];
    const s = profitStats(orders, products, current);
    expect(s.revenue).toBe(116000 - 5000 + 308000);
    expect(s.hpp).toBe(40000 + 21000 + 100000);
    expect(s.profit).toBe(s.revenue - s.hpp);
    expect(s.byProduct.map((p) => [p.productId, p.qty, p.revenue, p.hpp])).toEqual([
      ["box", 1, 250000, 100000],
      ["croissant", 3, 174000, 61000],
    ]);
    expect(profitStats([], products, current).marginPct).toBeNull();
  });
});
