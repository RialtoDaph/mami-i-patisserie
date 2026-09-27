// Test fixture mirroring supabase/seed.sql (DUMMY data).
import type { CostingData, Ingredient, Recipe } from "./types";

const ing = (id: string, name: string, purchaseUnit: Ingredient["purchaseUnit"], purchaseQty: number, purchasePrice: number, baseUnit: Ingredient["baseUnit"], category: Ingredient["category"] = "bahan"): Ingredient =>
  ({ id, name, category, purchaseUnit, purchaseQty, purchasePrice, baseUnit });

export const ingredients: Ingredient[] = [
  ing("tepung", "Tepung", "kg", 1, 14000, "g"),
  ing("butter", "Butter 227 g", "pack", 227, 45000, "g"),
  ing("susu", "Susu", "liter", 1, 20000, "ml"),
  ing("telur", "Telur (tray 30)", "pcs", 30, 60000, "pcs"),
  ing("minyak", "Minyak", "liter", 2, 38000, "ml"),
  ing("ayam", "Ayam", "kg", 1, 55000, "g"),
  ing("wortel", "Wortel", "kg", 1, 15000, "g"),
  ing("bombay", "Bombay", "kg", 1, 30000, "g"),
  ing("panir", "Panir", "kg", 1, 30000, "g"),
  ing("paste", "Pistachio paste", "pack", 200, 120000, "g"),
  ing("cream", "Whipping cream", "liter", 1, 95000, "ml"),
  ing("gula", "Gula halus", "kg", 1, 20000, "g"),
  ing("croissant", "Croissant supplier", "pcs", 1, 12000, "pcs"),
  ing("boxCroissant", "Box croissant", "pack", 20, 50000, "pcs", "kemasan"),
  ing("boxBlessings", "Box Blessings", "pcs", 1, 25000, "pcs", "kemasan"),
  ing("kartu", "Kartu", "pcs", 100, 150000, "pcs", "kemasan"),
];

const i = (id: string, quantity: number, unit: Recipe["items"][number]["unit"]) =>
  ({ source: { kind: "ingredient" as const, id }, quantity, unit });
const r = (id: string, quantity: number, unit: Recipe["items"][number]["unit"]) =>
  ({ source: { kind: "recipe" as const, id }, quantity, unit });

export const risol: Recipe = {
  id: "risol", name: "Risol Ragout", category: "mamis", yieldQty: 30, yieldUnit: "pcs",
  wastePct: 5, targetHppPct: 35, sellingPrice: 7000, isActive: true,
  items: [
    i("tepung", 250, "g"), i("telur", 5, "pcs"), i("susu", 500, "ml"), i("butter", 50, "g"),
    i("ayam", 0.5, "kg"), i("wortel", 200, "g"), i("bombay", 100, "g"), i("panir", 250, "g"),
    i("minyak", 300, "ml"),
  ],
};

export const pistachioCream: Recipe = {
  id: "pcream", name: "Pistachio Cream", category: "sub_resep", yieldQty: 500, yieldUnit: "g",
  wastePct: 5, targetHppPct: 35, sellingPrice: null, isActive: true,
  items: [i("paste", 100, "g"), i("cream", 300, "ml"), i("gula", 80, "g"), i("susu", 100, "ml")],
};

export const pistachioCroissant: Recipe = {
  id: "pcroissant", name: "Pistachio Croissant", category: "pastry_supplier", yieldQty: 10,
  yieldUnit: "pcs", wastePct: 0, targetHppPct: 35, sellingPrice: 58000, isActive: true,
  items: [i("croissant", 10, "pcs"), r("pcream", 250, "g"), i("boxCroissant", 10, "pcs")],
};

export const data: CostingData = {
  ingredients,
  recipes: [risol, pistachioCream, pistachioCroissant],
  bundles: [
    {
      id: "blessings", name: "Blessings Box", targetHppPct: 35, sellingPrice: 250000, isActive: true,
      items: [r("risol", 6, "pcs"), r("pcroissant", 2, "pcs"), i("boxBlessings", 1, "pcs"), i("kartu", 1, "pcs")],
    },
  ],
};

// Hand-computed expectations (see seed.sql comments).
export const RISOL_BATCH = 3500 + 10000 + 10000 + (50 * 45000) / 227 + 27500 + 3000 + 3000 + 7500 + 5700;
export const RISOL_PER_PCS = RISOL_BATCH / 28.5;
export const PCREAM_PER_G = 92100 / 475;
export const CROISSANT_PER_PCS = (120000 + 250 * PCREAM_PER_G + 25000) / 10;
export const BLESSINGS_COST = 6 * RISOL_PER_PCS + 2 * CROISSANT_PER_PCS + 25000 + 1500;
