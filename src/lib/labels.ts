import type { AppRole } from "./permissions";
import type { IngredientCategory, RecipeCategory } from "./costing";

export const RECIPE_CATEGORY_LABEL: Record<RecipeCategory, string> = {
  mamis: "Mami's",
  pastry_supplier: "Pastry supplier",
  minuman: "Minuman",
  sub_resep: "Isian / sub-resep",
};

export const INGREDIENT_CATEGORY_LABEL: Record<IngredientCategory, string> = {
  bahan: "Bahan",
  kemasan: "Kemasan",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  owner: "Owner",
  admin: "Admin",
  produksi: "Produksi",
  manager: "Manager",
};
