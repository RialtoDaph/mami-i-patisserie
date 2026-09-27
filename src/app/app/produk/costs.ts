import "server-only";
import { computeBundleCost, computeRecipeCost, createContext } from "@/lib/costing";
import type { FullCostingData } from "@/lib/data";

/** Cost per recipe yield unit ("r:<id>") and per bundle ("b:<id>"); null if it cannot be computed. */
export function sourceCosts(costing: FullCostingData): Record<string, number | null> {
  const ctx = createContext(costing.ingredients, costing.recipes);
  const out: Record<string, number | null> = {};
  const safe = (fn: () => number) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  for (const r of costing.recipes) out[`r:${r.id}`] = safe(() => computeRecipeCost(ctx, r.id).costPerUnit);
  for (const b of costing.bundles) out[`b:${b.id}`] = safe(() => computeBundleCost(ctx, b).cost);
  return out;
}
