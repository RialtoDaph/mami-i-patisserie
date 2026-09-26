import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { AppRole } from "./permissions";
import type {
  BaseUnit, Bundle, CostItem, CostingData, Ingredient, IngredientCategory, ItemUnit,
  PurchaseUnit, Recipe, RecipeCategory, YieldUnit,
} from "./costing";

// ---- Row types (snake_case, as returned by PostgREST) ----------------------

interface IngredientRow {
  id: string;
  name: string;
  category: IngredientCategory;
  supplier: string | null;
  purchase_unit: PurchaseUnit;
  purchase_qty: number | string;
  purchase_price: number | string;
  base_unit: BaseUnit;
  price_per_base_unit: number | string;
  notes: string | null;
  is_dummy: boolean;
  updated_at: string;
}

interface RecipeItemRow {
  ingredient_id: string | null;
  sub_recipe_id: string | null;
  quantity: number | string;
  unit: ItemUnit;
  sort_order: number;
}

interface RecipeRow {
  id: string;
  name: string;
  category: RecipeCategory;
  yield_qty: number | string;
  yield_unit: YieldUnit;
  waste_pct: number | string;
  target_hpp_pct: number | string;
  selling_price: number | string | null;
  is_active: boolean;
  notes: string | null;
  is_dummy: boolean;
  updated_at: string;
  recipe_items: RecipeItemRow[];
}

interface BundleItemRow {
  recipe_id: string | null;
  ingredient_id: string | null;
  quantity: number | string;
  unit: ItemUnit;
  sort_order: number;
}

interface BundleRow {
  id: string;
  name: string;
  selling_price: number | string | null;
  target_hpp_pct: number | string;
  is_active: boolean;
  notes: string | null;
  is_dummy: boolean;
  updated_at: string;
  bundle_items: BundleItemRow[];
}

// ---- App-level types -------------------------------------------------------

export interface IngredientFull extends Ingredient {
  supplier: string | null;
  notes: string | null;
  isDummy: boolean;
  updatedAt: string;
}

export interface RecipeFull extends Recipe {
  notes: string | null;
  isDummy: boolean;
  updatedAt: string;
}

export interface BundleFull extends Bundle {
  notes: string | null;
  isDummy: boolean;
  updatedAt: string;
}

export interface FullCostingData extends CostingData {
  ingredients: IngredientFull[];
  recipes: RecipeFull[];
  bundles: BundleFull[];
}

const num = (v: number | string) => Number(v);
const numOrNull = (v: number | string | null) => (v == null ? null : Number(v));
const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

function mapIngredient(r: IngredientRow): IngredientFull {
  return {
    id: r.id, name: r.name, category: r.category, supplier: r.supplier,
    purchaseUnit: r.purchase_unit, purchaseQty: num(r.purchase_qty),
    purchasePrice: num(r.purchase_price), baseUnit: r.base_unit,
    notes: r.notes, isDummy: r.is_dummy, updatedAt: r.updated_at,
  };
}

function mapRecipe(r: RecipeRow): RecipeFull {
  const items: CostItem[] = [...r.recipe_items].sort(bySort).map((i) => ({
    source: i.ingredient_id
      ? { kind: "ingredient", id: i.ingredient_id }
      : { kind: "recipe", id: i.sub_recipe_id! },
    quantity: num(i.quantity),
    unit: i.unit,
  }));
  return {
    id: r.id, name: r.name, category: r.category, yieldQty: num(r.yield_qty),
    yieldUnit: r.yield_unit, wastePct: num(r.waste_pct), targetHppPct: num(r.target_hpp_pct),
    sellingPrice: numOrNull(r.selling_price), isActive: r.is_active, items,
    notes: r.notes, isDummy: r.is_dummy, updatedAt: r.updated_at,
  };
}

function mapBundle(b: BundleRow): BundleFull {
  const items: CostItem[] = [...b.bundle_items].sort(bySort).map((i) => ({
    source: i.recipe_id ? { kind: "recipe", id: i.recipe_id } : { kind: "ingredient", id: i.ingredient_id! },
    quantity: num(i.quantity),
    unit: i.unit,
  }));
  return {
    id: b.id, name: b.name, sellingPrice: numOrNull(b.selling_price),
    targetHppPct: num(b.target_hpp_pct), isActive: b.is_active, items,
    notes: b.notes, isDummy: b.is_dummy, updatedAt: b.updated_at,
  };
}

// ---- Queries ----------------------------------------------------------------

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  role: AppRole | null;
}

/** Logged-in user with role. Redirects to /login when not logged in. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", claims.sub)
    .maybeSingle();
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    fullName: profile?.full_name ?? "",
    role: (profile?.role as AppRole | null) ?? null,
  };
});

/** Everything needed to compute costs. The dataset is small, so load it whole. */
export const loadCostingData = cache(async (): Promise<FullCostingData> => {
  const supabase = await createClient();
  const [ing, rec, bun] = await Promise.all([
    supabase.from("ingredients").select("*").order("name"),
    supabase.from("recipes").select("*, recipe_items!recipe_items_recipe_id_fkey(ingredient_id, sub_recipe_id, quantity, unit, sort_order)").order("name"),
    supabase.from("bundles").select("*, bundle_items(recipe_id, ingredient_id, quantity, unit, sort_order)").order("name"),
  ]);
  const error = ing.error ?? rec.error ?? bun.error;
  if (error) throw new Error(`Gagal memuat data: ${error.message}`);
  return {
    ingredients: (ing.data as IngredientRow[]).map(mapIngredient),
    recipes: (rec.data as RecipeRow[]).map(mapRecipe),
    bundles: (bun.data as BundleRow[]).map(mapBundle),
  };
});

export interface PriceHistoryEntry {
  id: number;
  oldPurchasePrice: number | null;
  newPurchasePrice: number;
  oldPricePerBaseUnit: number | null;
  newPricePerBaseUnit: number;
  changedAt: string;
}

export async function loadPriceHistory(ingredientId: string): Promise<PriceHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ingredient_price_history")
    .select("id, old_purchase_price, new_purchase_price, old_price_per_base_unit, new_price_per_base_unit, changed_at")
    .eq("ingredient_id", ingredientId)
    .order("changed_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`Gagal memuat riwayat harga: ${error.message}`);
  return data.map((h) => ({
    id: h.id,
    oldPurchasePrice: numOrNull(h.old_purchase_price),
    newPurchasePrice: num(h.new_purchase_price),
    oldPricePerBaseUnit: numOrNull(h.old_price_per_base_unit),
    newPricePerBaseUnit: num(h.new_price_per_base_unit),
    changedAt: h.changed_at,
  }));
}
