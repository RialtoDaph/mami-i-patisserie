// Domain types for costing. Money is in Rupiah (may be fractional in intermediate
// results), percentages are percent numbers (35 = 35%).

export type IngredientCategory = "bahan" | "kemasan";
export type PurchaseUnit = "kg" | "liter" | "pcs" | "pack";
export type BaseUnit = "g" | "ml" | "pcs";
export type RecipeCategory = "mamis" | "pastry_supplier" | "minuman" | "sub_resep";
export type YieldUnit = "pcs" | "porsi" | "g" | "ml";
export type ItemUnit = "g" | "kg" | "ml" | "liter" | "pcs" | "porsi";

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  purchaseUnit: PurchaseUnit;
  /** In purchase units for kg/liter/pcs; in base units for pack. */
  purchaseQty: number;
  purchasePrice: number;
  baseUnit: BaseUnit;
}

export type ItemSource =
  | { kind: "ingredient"; id: string }
  | { kind: "recipe"; id: string };

export interface CostItem {
  source: ItemSource;
  quantity: number;
  unit: ItemUnit;
}

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  yieldQty: number;
  yieldUnit: YieldUnit;
  wastePct: number;
  targetHppPct: number;
  /** Per yield unit, excluding PBJT. Null when not sold directly (sub-recipes). */
  sellingPrice: number | null;
  isActive: boolean;
  items: CostItem[];
}

export interface Bundle {
  id: string;
  name: string;
  targetHppPct: number;
  sellingPrice: number | null;
  isActive: boolean;
  items: CostItem[];
}

export interface CostLine {
  source: ItemSource;
  name: string;
  quantity: number;
  unit: ItemUnit;
  /** Price per base/yield unit of the source. */
  unitCost: number;
  cost: number;
}

export interface RecipeCost {
  batchCost: number;
  /** Yield left after waste. */
  sellableQty: number;
  /** Cost per yield unit (pcs/porsi/g/ml) after waste. */
  costPerUnit: number;
  lines: CostLine[];
}

export interface BundleCost {
  cost: number;
  lines: CostLine[];
}

export interface CostingData {
  ingredients: Ingredient[];
  recipes: Recipe[];
  bundles: Bundle[];
}
