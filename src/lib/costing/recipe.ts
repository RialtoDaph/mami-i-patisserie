import { pricePerBaseUnit, toTargetQuantity } from "./units";
import type { CostItem, CostLine, Ingredient, Recipe, RecipeCost } from "./types";

export class CostingError extends Error {}

/** Yield left after waste: waste reduces the sellable output of a batch. */
export function sellableQuantity(yieldQty: number, wastePct: number): number {
  if (!(yieldQty > 0)) throw new CostingError("Hasil jadi harus lebih dari 0");
  if (!(wastePct >= 0 && wastePct < 100)) throw new CostingError("Susut harus antara 0% dan kurang dari 100%");
  return yieldQty * (1 - wastePct / 100);
}

/** Cost per yield unit = batch cost / (yield × (1 − waste%)). */
export function costPerPiece(batchCost: number, yieldQty: number, wastePct: number): number {
  return batchCost / sellableQuantity(yieldQty, wastePct);
}

export interface CostContext {
  ingredients: Map<string, Ingredient>;
  recipes: Map<string, Recipe>;
  /** Memoized results, filled as recipes are computed. */
  cache: Map<string, RecipeCost>;
}

export function createContext(ingredients: Ingredient[], recipes: Recipe[]): CostContext {
  return {
    ingredients: new Map(ingredients.map((i) => [i.id, i])),
    recipes: new Map(recipes.map((r) => [r.id, r])),
    cache: new Map(),
  };
}

/** Cost of one item line (ingredient or sub-recipe). */
export function costLine(ctx: CostContext, item: CostItem, stack: string[] = []): CostLine {
  if (item.source.kind === "ingredient") {
    const ing = ctx.ingredients.get(item.source.id);
    if (!ing) throw new CostingError(`Bahan tidak ditemukan (${item.source.id})`);
    const unitCost = pricePerBaseUnit(ing);
    const qty = toTargetQuantity(item.quantity, item.unit, ing.baseUnit);
    return { source: item.source, name: ing.name, quantity: item.quantity, unit: item.unit, unitCost, cost: qty * unitCost };
  }
  const sub = ctx.recipes.get(item.source.id);
  if (!sub) throw new CostingError(`Sub-resep tidak ditemukan (${item.source.id})`);
  const unitCost = computeRecipeCost(ctx, sub.id, stack).costPerUnit;
  const qty = toTargetQuantity(item.quantity, item.unit, sub.yieldUnit);
  return { source: item.source, name: sub.name, quantity: item.quantity, unit: item.unit, unitCost, cost: qty * unitCost };
}

/** Batch cost, sellable quantity and cost per yield unit of a recipe (recursive, memoized). */
export function computeRecipeCost(ctx: CostContext, recipeId: string, stack: string[] = []): RecipeCost {
  const cached = ctx.cache.get(recipeId);
  if (cached) return cached;
  if (stack.includes(recipeId)) {
    throw new CostingError("Referensi melingkar antar resep");
  }
  const recipe = ctx.recipes.get(recipeId);
  if (!recipe) throw new CostingError(`Resep tidak ditemukan (${recipeId})`);

  const nextStack = [...stack, recipeId];
  const lines = recipe.items.map((item) => costLine(ctx, item, nextStack));
  const batchCost = lines.reduce((sum, l) => sum + l.cost, 0);
  const sellableQty = sellableQuantity(recipe.yieldQty, recipe.wastePct);
  const result: RecipeCost = { batchCost, sellableQty, costPerUnit: batchCost / sellableQty, lines };
  ctx.cache.set(recipeId, result);
  return result;
}

/** Costs for every recipe. */
export function computeAllRecipeCosts(ingredients: Ingredient[], recipes: Recipe[]): Map<string, RecipeCost> {
  const ctx = createContext(ingredients, recipes);
  for (const r of recipes) computeRecipeCost(ctx, r.id);
  return ctx.cache;
}
