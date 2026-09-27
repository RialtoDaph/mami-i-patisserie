import { describe, expect, it } from "vitest";
import { baseUnitsFor, isCompatibleUnit, pricePerBaseUnit, toTargetQuantity, unitsFor } from "./units";

describe("pricePerBaseUnit", () => {
  it("converts kg to grams", () => {
    expect(pricePerBaseUnit({ purchaseUnit: "kg", purchaseQty: 1, purchasePrice: 14000 })).toBe(14);
    expect(pricePerBaseUnit({ purchaseUnit: "kg", purchaseQty: 25, purchasePrice: 300000 })).toBe(12);
  });
  it("converts liter to ml", () => {
    expect(pricePerBaseUnit({ purchaseUnit: "liter", purchaseQty: 2, purchasePrice: 38000 })).toBe(19);
  });
  it("treats pcs and pack quantities as base units", () => {
    expect(pricePerBaseUnit({ purchaseUnit: "pcs", purchaseQty: 30, purchasePrice: 60000 })).toBe(2000);
    expect(pricePerBaseUnit({ purchaseUnit: "pack", purchaseQty: 200, purchasePrice: 120000 })).toBe(600);
  });
  it("rejects zero quantity", () => {
    expect(() => pricePerBaseUnit({ purchaseUnit: "kg", purchaseQty: 0, purchasePrice: 1 })).toThrow();
  });
});

describe("unit families", () => {
  it("allows only same-family units", () => {
    expect(isCompatibleUnit("kg", "g")).toBe(true);
    expect(isCompatibleUnit("liter", "ml")).toBe(true);
    expect(isCompatibleUnit("g", "ml")).toBe(false);
    expect(isCompatibleUnit("pcs", "porsi")).toBe(false);
    expect(unitsFor("g")).toEqual(["g", "kg"]);
    expect(unitsFor("porsi")).toEqual(["porsi"]);
  });
  it("converts to the target unit", () => {
    expect(toTargetQuantity(0.5, "kg", "g")).toBe(500);
    expect(toTargetQuantity(1.5, "liter", "ml")).toBe(1500);
    expect(() => toTargetQuantity(1, "g", "ml")).toThrow();
  });
  it("lists valid base units per purchase unit", () => {
    expect(baseUnitsFor("kg")).toEqual(["g"]);
    expect(baseUnitsFor("pack")).toEqual(["g", "ml", "pcs"]);
  });
});
