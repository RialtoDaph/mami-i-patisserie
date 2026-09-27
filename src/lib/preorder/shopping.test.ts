import { describe, expect, it } from "vitest";
import {
  buyLabel, groupShopping, hasPaidDp, ingredientNeeds, needLabel, ordersInRange, productQuantities, shoppingMessage, shoppingRows,
} from "./shopping";
import { order, products } from "./fixtures";
import { data, ingredients } from "../costing/fixtures";

const needsFor = (qty: [string, number][], roundBatches = false) =>
  ingredientNeeds(new Map(qty), products, data.ingredients, data.recipes, data.bundles, { roundBatches });

describe("ingredientNeeds", () => {
  it("expands recipes and sub-recipes proportionally", () => {
    // 5 croissants = 0.5 batch; 125 g pistachio cream = 125/475 cream batch.
    const n = needsFor([["croissant", 5]]);
    expect(n.get("croissant")).toBeCloseTo(5);
    expect(n.get("boxCroissant")).toBeCloseTo(5);
    expect(n.get("paste")).toBeCloseTo((100 * 125) / 475);
    expect(n.get("cream")).toBeCloseTo((300 * 125) / 475);
    expect(n.has("tepung")).toBe(false);
  });

  it("rounds up to whole batches, cascading into sub-recipes", () => {
    const n = needsFor([["croissant", 5]], true);
    expect(n.get("croissant")).toBe(10);
    expect(n.get("boxCroissant")).toBe(10);
    // 1 croissant batch needs 250 g cream → 1 whole cream batch.
    expect(n.get("paste")).toBe(100);
    expect(n.get("susu")).toBe(100);
  });

  it("does not add a batch for exact multiples", () => {
    expect(needsFor([["croissant", 10]], true).get("croissant")).toBe(10);
  });

  it("converts units and adds bundle packaging", () => {
    // Blessings Box: 6 risol + 2 croissant + box + card.
    const n = needsFor([["box", 2]]);
    expect(n.get("boxBlessings")).toBe(2);
    expect(n.get("kartu")).toBe(2);
    expect(n.get("croissant")).toBeCloseTo(4);
    // Risol uses 0.5 kg chicken per 28.5 sellable pcs; 12 risol needed.
    expect(n.get("ayam")).toBeCloseTo((500 * 12) / 28.5);
  });

  it("applies units per product", () => {
    // Risol frozen isi 10 → 10 risol per pack.
    expect(needsFor([["risolFrozen", 1]]).get("telur")).toBeCloseTo((5 * 10) / 28.5);
  });
});

describe("shoppingRows", () => {
  it("computes packs to buy and costs", () => {
    const rows = shoppingRows(needsFor([["croissant", 5]]), ingredients);
    const by = Object.fromEntries(rows.map((r) => [r.ingredientId, r]));
    expect(by.croissant).toMatchObject({ packs: 5, packSize: 1, buyCost: 60000 });
    expect(by.boxCroissant).toMatchObject({ packs: 1, packSize: 20, buyCost: 50000 });
    expect(by.boxCroissant.useCost).toBeCloseTo(12500);
    expect(by.susu).toMatchObject({ packSize: 1000, packs: 1, buyCost: 20000 });
    expect(rows.every((r) => r.needQty > 0)).toBe(true);
  });

  it("groups by category then supplier, unknown supplier last", () => {
    const withSupplier = ingredients.map((i) => ({ ...i, supplier: i.id === "croissant" ? "Bakery X" : i.id === "paste" ? "Toko A" : null }));
    const groups = groupShopping(shoppingRows(needsFor([["croissant", 5]]), withSupplier));
    expect(groups.map((g) => g.category)).toEqual(["bahan", "kemasan"]);
    expect(groups[0].suppliers.map((s) => s.supplier)).toEqual(["Bakery X", "Toko A", null]);
    expect(groups[1].suppliers[0].rows.map((r) => r.ingredientId)).toEqual(["boxCroissant"]);
  });
});

describe("order selection", () => {
  const orders = [
    order({ fulfillDate: "2026-10-01", status: "menunggu_dp", dpAmount: 50000, items: [{ productId: "croissant", qty: 2, unitPrice: 1 }] }),
    order({ fulfillDate: "2026-10-02", status: "dp_diterima", items: [{ productId: "croissant", qty: 3, unitPrice: 1 }] }),
    order({ fulfillDate: "2026-10-03", status: "batal", items: [{ productId: "croissant", qty: 9, unitPrice: 1 }] }),
    order({ fulfillDate: "2026-10-09", items: [{ productId: "croissant", qty: 7, unitPrice: 1 }] }),
  ];

  it("keeps non-cancelled orders in range, optionally only with DP paid", () => {
    expect(ordersInRange(orders, "2026-10-01", "2026-10-07").map((o) => o.fulfillDate)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(productQuantities(ordersInRange(orders, "2026-10-01", "2026-10-07", true)).get("croissant")).toBe(3);
  });

  it("treats payments covering the DP as paid", () => {
    expect(hasPaidDp({ status: "menunggu_dp", dpAmount: 50000, amountPaid: 50000 })).toBe(true);
    expect(hasPaidDp({ status: "menunggu_dp", dpAmount: 50000, amountPaid: 10000 })).toBe(false);
    expect(hasPaidDp({ status: "baru", dpAmount: 0, amountPaid: 0 })).toBe(false);
    expect(hasPaidDp({ status: "batal", dpAmount: 0, amountPaid: 99 })).toBe(false);
  });
});

describe("labels", () => {
  it("formats needed quantities", () => {
    expect(needLabel(350, "g")).toBe("350 g");
    expect(needLabel(1250, "g")).toBe("1,25 kg");
    expect(needLabel(2000, "ml")).toBe("2 liter");
    expect(needLabel(5.26, "pcs")).toBe("5,3 pcs");
  });

  it("formats what to buy", () => {
    expect(buyLabel({ packs: 2, packSize: 1000, purchaseUnit: "kg", baseUnit: "g" })).toBe("2 kg");
    expect(buyLabel({ packs: 1, packSize: 2000, purchaseUnit: "liter", baseUnit: "ml" })).toBe("1 × 2 liter");
    expect(buyLabel({ packs: 3, packSize: 1, purchaseUnit: "pcs", baseUnit: "pcs" })).toBe("3 pcs");
    expect(buyLabel({ packs: 1, packSize: 30, purchaseUnit: "pcs", baseUnit: "pcs" })).toBe("1 × 30 pcs");
    expect(buyLabel({ packs: 2, packSize: 227, purchaseUnit: "pack", baseUnit: "g" })).toBe("2 pack @227 g");
  });

  it("builds the WhatsApp message", () => {
    const groups = groupShopping(shoppingRows(needsFor([["croissant", 5]]), ingredients));
    const msg = shoppingMessage(groups, "Belanja 1–7 Okt", new Set(["croissant"]));
    expect(msg.split("\n")[0]).toBe("*Belanja 1–7 Okt*");
    expect(msg).toContain("✅ Croissant supplier: 5 pcs (butuh 5 pcs)");
    expect(msg).toContain("▫️ Box croissant: 1 pack @20 pcs (butuh 5 pcs)");
    expect(msg).toContain("*Kemasan*");
  });
});
