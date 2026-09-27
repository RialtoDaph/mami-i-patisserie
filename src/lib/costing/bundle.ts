import { costLine, type CostContext } from "./recipe";
import type { Bundle, BundleCost } from "./types";

/** Bundle cost = sum of the cost of all its contents (products, packaging, card). */
export function computeBundleCost(ctx: CostContext, bundle: Pick<Bundle, "items">): BundleCost {
  const lines = bundle.items.map((item) => costLine(ctx, item));
  return { cost: lines.reduce((sum, l) => sum + l.cost, 0), lines };
}
