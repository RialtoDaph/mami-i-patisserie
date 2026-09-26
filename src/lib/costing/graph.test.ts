import { describe, expect, it } from "vitest";
import { allowedSubRecipes, recipesUsing, wouldCreateCycle } from "./graph";
import { data } from "./fixtures";

describe("cycle prevention", () => {
  it("detects direct and indirect cycles", () => {
    // pcroissant uses pcream, so pcream may not use pcroissant
    expect(wouldCreateCycle(data.recipes, "pcream", "pcroissant")).toBe(true);
    expect(wouldCreateCycle(data.recipes, "pcream", "pcream")).toBe(true);
    expect(wouldCreateCycle(data.recipes, "pcroissant", "pcream")).toBe(false);
    expect(wouldCreateCycle(data.recipes, "risol", "pcroissant")).toBe(false);
  });
  it("lists only safe sub-recipes", () => {
    expect(allowedSubRecipes(data.recipes, "pcream").map((r) => r.id)).toEqual(["risol"]);
    expect(allowedSubRecipes(data.recipes, null)).toHaveLength(3);
  });
  it("finds recipes that use a sub-recipe", () => {
    expect([...recipesUsing(data.recipes, "pcream")]).toEqual(["pcroissant"]);
  });
});
