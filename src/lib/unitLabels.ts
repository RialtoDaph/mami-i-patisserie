import type { BaseUnit, PurchaseUnit } from "./costing";

export const PURCHASE_UNIT_LABEL: Record<PurchaseUnit, string> = {
  kg: "kg",
  liter: "liter",
  pcs: "pcs",
  pack: "pack",
};

/** "Rp 14.000 / 1 kg", "Rp 45.000 / pack 227 g" */
export function purchaseDescription(unit: PurchaseUnit, qty: number, base: BaseUnit, fmtQty: (n: number) => string): string {
  return unit === "pack" ? `pack isi ${fmtQty(qty)} ${base}` : `${fmtQty(qty)} ${unit}`;
}
