export const PBJT_RATE = 0.1;
export const DEFAULT_TARGET_HPP_PCT = 35;

export type RoundingStep = 500 | 1000;
export type HppStatus = "under" | "over" | "unknown";

// Guards against float noise such as 3500 / 0.35 = 10000.000000000002.
function clean(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** HPP % = cost per piece / selling price × 100. Null when there is no selling price. */
export function hppPct(costPerPiece: number, sellingPrice: number | null): number | null {
  if (sellingPrice == null || sellingPrice <= 0) return null;
  return (costPerPiece / sellingPrice) * 100;
}

/** Rounds up to the next multiple of `step` (Rupiah). */
export function roundUpTo(amount: number, step: RoundingStep): number {
  return Math.ceil(clean(amount / step)) * step;
}

/** Suggested price = cost per piece / target HPP, rounded up to Rp 500 or Rp 1.000. */
export function suggestedPrice(costPerPiece: number, targetHppPct: number, step: RoundingStep): number {
  if (!(targetHppPct > 0)) throw new Error("Target HPP harus lebih dari 0");
  return roundUpTo(clean((costPerPiece * 100) / targetHppPct), step);
}

/** Gross margin per piece = selling price − cost. Null without a selling price. */
export function grossMargin(costPerPiece: number, sellingPrice: number | null): number | null {
  if (sellingPrice == null) return null;
  return sellingPrice - costPerPiece;
}

/** Price including PBJT 10%, rounded to whole Rupiah. */
export function withPbjt(price: number, rate: number = PBJT_RATE): number {
  return Math.round(clean(price * (1 + rate)));
}

/** At or below target counts as "under" (green); above target is "over" (red). */
export function hppStatus(hpp: number | null, targetHppPct: number): HppStatus {
  if (hpp == null) return "unknown";
  return clean(hpp) <= targetHppPct ? "under" : "over";
}
