import { describe, expect, it } from "vitest";
import { computeAllRecipeCosts, computeRecipeCost, costPerPiece, createContext, sellableQuantity } from "./recipe";
import { computeBundleCost } from "./bundle";
import {
  BLESSINGS_COST, CROISSANT_PER_PCS, PCREAM_PER_G, RISOL_BATCH, RISOL_PER_PCS, data, ingredients,
} from "./fixtures";
import type { Recipe } from "./types";

describe("costPerPiece", () => {
  it("divides by sellable yield after waste", () => {
    expect(costPerPiece(100000, 50, 0)).toBe(2000);
    expect(costPerPiece(90000, 100, 10)).toBeCloseTo(1000);
    expect(sellableQuantity(30, 5)).toBeCloseTo(28.5);
  });
  it("rejects invalid yield or waste", () => {
    expect(() => costPerPiece(1, 0, 0)).toThrow();
    expect(() => costPerPiece(1, 10, 100)).toThrow();
    expect(() => costPerPiece(1, 10, -1)).toThrow();
  });
});

describe("computeRecipeCost", () => {
  const costs = computeAllRecipeCosts(data.ingredients, data.recipes);

  it("computes batch and per-piece cost of a plain recipe", () => {
    const risol = costs.get("risol")!;
    expect(risol.batchCost).toBeCloseTo(RISOL_BATCH, 6);
    expect(risol.costPerUnit).toBeCloseTo(RISOL_PER_PCS, 6);
    expect(risol.lines).toHaveLength(9);
    expect(risol.lines.find((l) => l.source.id === "ayam")!.cost).toBeCloseTo(27500);
  });

  it("computes sub-recipe cost per gram and uses it in the parent", () => {
    expect(costs.get("pcream")!.costPerUnit).toBeCloseTo(PCREAM_PER_G, 6);
    expect(costs.get("pcroissant")!.costPerUnit).toBeCloseTo(CROISSANT_PER_PCS, 6);
  });

  it("detects circular references", () => {
    const a: Recipe = { ...data.recipes[1], id: "a", items: [{ source: { kind: "recipe", id: "b" }, quantity: 1, unit: "g" }] };
    const b: Recipe = { ...data.recipes[1], id: "b", items: [{ source: { kind: "recipe", id: "a" }, quantity: 1, unit: "g" }] };
    const ctx = createContext(ingredients, [a, b]);
    expect(() => computeRecipeCost(ctx, "a")).toThrow(/melingkar/);
  });

  it("reports missing ingredients and unit mismatches", () => {
    const bad: Recipe = { ...data.recipes[0], id: "bad", items: [{ source: { kind: "ingredient", id: "nope" }, quantity: 1, unit: "g" }] };
    expect(() => computeRecipeCost(createContext(ingredients, [bad]), "bad")).toThrow(/tidak ditemukan/);
    const mismatch: Recipe = { ...data.recipes[0], id: "mm", items: [{ source: { kind: "ingredient", id: "susu" }, quantity: 1, unit: "g" }] };
    expect(() => computeRecipeCost(createContext(ingredients, [mismatch]), "mm")).toThrow(/tidak cocok/);
  });

  it("returns zero cost for a recipe without items", () => {
    const empty: Recipe = { ...data.recipes[0], id: "e", items: [] };
    expect(computeRecipeCost(createContext(ingredients, [empty]), "e").costPerUnit).toBe(0);
  });
});

describe("computeBundleCost", () => {
  it("sums products, packaging and card", () => {
    const ctx = createContext(data.ingredients, data.recipes);
    const res = computeBundleCost(ctx, data.bundles[0]);
    expect(res.cost).toBeCloseTo(BLESSINGS_COST, 6);
    expect(res.lines.map((l) => l.name)).toEqual(["Risol Ragout", "Pistachio Croissant", "Box Blessings", "Kartu"]);
  });
});
