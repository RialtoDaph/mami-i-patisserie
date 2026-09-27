import type { Recipe } from "./types";

type Edges = Map<string, string[]>;

function subRecipeEdges(recipes: Pick<Recipe, "id" | "items">[]): Edges {
  const edges: Edges = new Map();
  for (const r of recipes) {
    edges.set(
      r.id,
      r.items.filter((i) => i.source.kind === "recipe").map((i) => i.source.id),
    );
  }
  return edges;
}

/** All recipes reachable from `startId` via sub-recipe links (including itself). */
function descendants(edges: Edges, startId: string): Set<string> {
  const seen = new Set<string>();
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const next of edges.get(id) ?? []) stack.push(next);
  }
  return seen;
}

/** True if adding `subRecipeId` as an item of `recipeId` would create a cycle. */
export function wouldCreateCycle(
  recipes: Pick<Recipe, "id" | "items">[],
  recipeId: string,
  subRecipeId: string,
): boolean {
  return descendants(subRecipeEdges(recipes), subRecipeId).has(recipeId);
}

/** Recipes that may be used as a sub-recipe inside `recipeId` without forming a cycle. */
export function allowedSubRecipes<R extends Pick<Recipe, "id" | "items">>(
  recipes: R[],
  recipeId: string | null,
): R[] {
  if (!recipeId) return recipes;
  const edges = subRecipeEdges(recipes);
  return recipes.filter((r) => !descendants(edges, r.id).has(recipeId));
}

/** IDs of recipes that use `recipeId` directly or indirectly (excluding itself). */
export function recipesUsing(recipes: Pick<Recipe, "id" | "items">[], recipeId: string): Set<string> {
  const result = new Set<string>();
  const edges = subRecipeEdges(recipes);
  for (const r of recipes) {
    if (r.id !== recipeId && descendants(edges, r.id).has(recipeId)) result.add(r.id);
  }
  return result;
}
