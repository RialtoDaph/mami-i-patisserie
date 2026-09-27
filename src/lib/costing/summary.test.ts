import { describe, expect, it } from "vitest";
import { buildSummary, priceImpact } from "./summary";
import { BLESSINGS_COST, RISOL_PER_PCS, data, ingredients } from "./fixtures";

describe("buildSummary", () => {
  const rows = buildSummary(data, { roundingStep: 1000, includePbjt: false });

  it("lists products and bundles but not sub-recipes", () => {
    expect(rows.map((r) => r.id)).toEqual(["risol", "pcroissant", "blessings"]);
  });

  it("colors by target", () => {
    const risol = rows.find((r) => r.id === "risol")!;
    expect(risol.cost).toBeCloseTo(RISOL_PER_PCS, 6);
    expect(risol.hppPct).toBeCloseTo((RISOL_PER_PCS / 7000) * 100, 6);
    expect(risol.status).toBe("over");
    expect(risol.suggestedPrice).toBe(9000);
    expect(risol.margin).toBeCloseTo(7000 - RISOL_PER_PCS, 6);
    expect(rows.find((r) => r.id === "pcroissant")!.status).toBe("under");
    const box = rows.find((r) => r.id === "blessings")!;
    expect(box.cost).toBeCloseTo(BLESSINGS_COST, 6);
    expect(box.status).toBe("under");
  });

  it("shows prices with PBJT without changing HPP", () => {
    const withTax = buildSummary(data, { roundingStep: 500, includePbjt: true });
    const risol = withTax.find((r) => r.id === "risol")!;
    expect(risol.displayPrice).toBe(7700);
    expect(risol.sellingPrice).toBe(7000);
    expect(risol.suggestedPrice).toBe(9350); // 8500 + 10%
    expect(risol.hppPct).toBeCloseTo(rows[0].hppPct!, 9);
  });

  it("hides inactive products unless asked", () => {
    const d = { ...data, recipes: data.recipes.map((r) => (r.id === "risol" ? { ...r, isActive: false } : r)) };
    expect(buildSummary(d, { roundingStep: 1000, includePbjt: false }).map((r) => r.id)).not.toContain("risol");
    expect(buildSummary(d, { roundingStep: 1000, includePbjt: false, includeInactive: true }).map((r) => r.id)).toContain("risol");
  });

  it("reports a row error instead of throwing", () => {
    const d = { ...data, ingredients: ingredients.filter((i) => i.id !== "ayam") };
    const risol = buildSummary(d, { roundingStep: 1000, includePbjt: false }).find((r) => r.id === "risol")!;
    expect(risol.cost).toBeNull();
    expect(risol.error).toMatch(/tidak ditemukan/);
    expect(risol.status).toBe("unknown");
  });
});

describe("priceImpact", () => {
  it("flags products that cross the target when an ingredient gets pricier", () => {
    const croissant = ingredients.find((i) => i.id === "croissant")!;
    const impact = priceImpact(data, { ...croissant, purchasePrice: 14000 });
    // pistachio croissant: +2000/pcs → 21347 → 36.8% of 58000 (was 33.4%)
    const pc = impact.find((r) => r.id === "pcroissant")!;
    expect(pc.newlyOver).toBe(true);
    expect(pc.costAfter - pc.costBefore).toBeCloseTo(2000);
    // Blessings box: +4000 → 86060 → 34.4%, affected but still under target
    const box = impact.find((r) => r.id === "blessings")!;
    expect(box.newlyOver).toBe(false);
    // risol does not use croissant
    expect(impact.find((r) => r.id === "risol")).toBeUndefined();
    expect(impact[0].id).toBe("pcroissant");
  });

  it("propagates through sub-recipes", () => {
    const paste = ingredients.find((i) => i.id === "paste")!;
    const impact = priceImpact(data, { ...paste, purchasePrice: 240000 });
    expect(impact.map((r) => r.id).sort()).toEqual(["blessings", "pcroissant"]);
  });

  it("returns nothing when the price is unchanged", () => {
    expect(priceImpact(data, ingredients[0])).toEqual([]);
  });
});
