import type { BaseUnit, ItemUnit, PurchaseUnit, YieldUnit } from "./types";

export type UnitFamily = "mass" | "volume" | "count" | "portion";

const FAMILY: Record<ItemUnit, UnitFamily> = {
  g: "mass",
  kg: "mass",
  ml: "volume",
  liter: "volume",
  pcs: "count",
  porsi: "portion",
};

/** Multiplier from an item unit to the smallest unit of its family (g, ml, pcs, porsi). */
const TO_SMALLEST: Record<ItemUnit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  liter: 1000,
  pcs: 1,
  porsi: 1,
};

export function unitFamily(unit: ItemUnit | BaseUnit | YieldUnit): UnitFamily {
  return FAMILY[unit];
}

export function isCompatibleUnit(itemUnit: ItemUnit, target: BaseUnit | YieldUnit): boolean {
  return unitFamily(itemUnit) === unitFamily(target);
}

/** Item units a user may pick for something measured in `target`. */
export function unitsFor(target: BaseUnit | YieldUnit): ItemUnit[] {
  return (Object.keys(FAMILY) as ItemUnit[]).filter((u) => isCompatibleUnit(u, target));
}

/** Converts a quantity in `unit` to the target's base/yield unit (all are smallest units). */
export function toTargetQuantity(quantity: number, unit: ItemUnit, target: BaseUnit | YieldUnit): number {
  if (!isCompatibleUnit(unit, target)) {
    throw new Error(`Satuan ${unit} tidak cocok dengan ${target}`);
  }
  return quantity * TO_SMALLEST[unit];
}

/** Valid base units for a purchase unit. Mirrors ingredients_unit_match in SQL. */
export function baseUnitsFor(purchaseUnit: PurchaseUnit): BaseUnit[] {
  switch (purchaseUnit) {
    case "kg":
      return ["g"];
    case "liter":
      return ["ml"];
    case "pcs":
      return ["pcs"];
    case "pack":
      return ["g", "ml", "pcs"];
  }
}

/** Base units contained in one purchase. Mirrors purchase_unit_factor in SQL. */
export function purchaseBaseQuantity(purchaseUnit: PurchaseUnit, purchaseQty: number): number {
  const factor = purchaseUnit === "kg" || purchaseUnit === "liter" ? 1000 : 1;
  return purchaseQty * factor;
}

export function pricePerBaseUnit(i: {
  purchaseUnit: PurchaseUnit;
  purchaseQty: number;
  purchasePrice: number;
}): number {
  const qty = purchaseBaseQuantity(i.purchaseUnit, i.purchaseQty);
  if (!(qty > 0)) throw new Error("Jumlah per kemasan harus lebih dari 0");
  return i.purchasePrice / qty;
}
