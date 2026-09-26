"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { loadCostingData } from "./data";
import { parseNumberInput } from "./format";
import { baseUnitsFor, priceImpact, type BaseUnit, type Ingredient, type ItemUnit, type PurchaseUnit, type RecipeCategory, type YieldUnit } from "./costing";

export interface ActionResult {
  error?: string;
}

interface PgError {
  code?: string;
  message: string;
}

/** Turns a Postgres/PostgREST error into a message Mami can understand. */
function friendlyError(e: PgError): string {
  switch (e.code) {
    case "23503":
      return "Data ini masih dipakai di resep atau paket, jadi tidak bisa dihapus.";
    case "42501":
      return e.message.startsWith("Role") ? e.message : "Anda tidak punya akses untuk aksi ini.";
    case "23514":
      // Our own trigger messages are already in Indonesian.
      return /^[A-Z][a-z]/.test(e.message) && !e.message.includes("violates") ? e.message : "Isian tidak valid. Periksa lagi angkanya.";
    case "P0001":
      return e.message;
    default:
      return `Gagal menyimpan: ${e.message}`;
  }
}

function refresh() {
  revalidatePath("/app", "layout");
}

// ---- Auth -------------------------------------------------------------------

export async function signIn(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau password salah." };
  // Only allow internal redirects.
  redirect(next.startsWith("/app") ? next : "/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---- Ingredients ------------------------------------------------------------

export interface ImpactItem {
  kind: "recipe" | "bundle";
  id: string;
  name: string;
  hppAfter: number | null;
  targetHppPct: number;
}

export interface IngredientFormState extends ActionResult {
  saved?: { id: string; newlyOver: ImpactItem[] };
}

const PURCHASE_UNITS: PurchaseUnit[] = ["kg", "liter", "pcs", "pack"];

export async function saveIngredient(_prev: IngredientFormState, formData: FormData): Promise<IngredientFormState> {
  const id = String(formData.get("id") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  const category = formData.get("category") === "kemasan" ? "kemasan" : "bahan";
  const purchaseUnit = String(formData.get("purchase_unit")) as PurchaseUnit;
  const purchaseQty = parseNumberInput(String(formData.get("purchase_qty") ?? ""));
  const purchasePrice = parseNumberInput(String(formData.get("purchase_price") ?? ""));
  const baseUnit = String(formData.get("base_unit")) as BaseUnit;

  if (!name) return { error: "Nama bahan wajib diisi." };
  if (!PURCHASE_UNITS.includes(purchaseUnit)) return { error: "Pilih satuan beli." };
  if (!baseUnitsFor(purchaseUnit).includes(baseUnit)) return { error: "Satuan dasar tidak cocok dengan satuan beli." };
  if (purchaseQty == null || purchaseQty <= 0) return { error: "Jumlah per kemasan harus lebih dari 0." };
  if (purchasePrice == null || purchasePrice < 0) return { error: "Harga beli tidak valid." };

  const row = {
    name,
    category,
    supplier: String(formData.get("supplier") ?? "").trim() || null,
    purchase_unit: purchaseUnit,
    purchase_qty: purchaseQty,
    purchase_price: Math.round(purchasePrice),
    base_unit: baseUnit,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };

  const supabase = await createClient();

  if (!id) {
    const { error } = await supabase.from("ingredients").insert(row);
    if (error) return { error: friendlyError(error) };
    refresh();
    redirect("/app/bahan");
  }

  // Compute the impact against the data as it is before saving.
  const data = await loadCostingData();
  const current = data.ingredients.find((i) => i.id === id);
  const updated: Ingredient = {
    id, name, category, purchaseUnit, purchaseQty, purchasePrice: row.purchase_price, baseUnit,
  };
  const newlyOver = current
    ? priceImpact(data, updated)
        .filter((r) => r.newlyOver)
        .map((r) => ({ kind: r.kind, id: r.id, name: r.name, hppAfter: r.hppAfter, targetHppPct: r.targetHppPct }))
    : [];

  const { data: res, error } = await supabase.from("ingredients").update(row).eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!res?.length) return { error: "Anda tidak punya akses untuk mengubah bahan ini." };
  refresh();
  return { saved: { id, newlyOver } };
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ingredients").delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus bahan." };
  refresh();
  redirect("/app/bahan");
}

// ---- Recipes ----------------------------------------------------------------

export interface ItemInput {
  kind: "ingredient" | "recipe";
  id: string;
  quantity: number;
  unit: ItemUnit;
}

export interface RecipeInput {
  id: string | null;
  name: string;
  category: RecipeCategory;
  yieldQty: number;
  yieldUnit: YieldUnit;
  wastePct: number;
  targetHppPct: number;
  sellingPrice: number | null;
  isActive: boolean;
  notes: string;
  items: ItemInput[];
}

function validateItems(items: ItemInput[]): string | null {
  for (const it of items) {
    if (!it.id) return "Ada baris yang belum dipilih bahannya.";
    if (!(it.quantity > 0)) return "Jumlah setiap bahan harus lebih dari 0.";
  }
  return null;
}

export async function saveRecipe(input: RecipeInput): Promise<ActionResult> {
  if (!input.name.trim()) return { error: "Nama resep wajib diisi." };
  if (!(input.yieldQty > 0)) return { error: "Hasil jadi harus lebih dari 0." };
  if (!(input.wastePct >= 0 && input.wastePct < 100)) return { error: "Susut harus antara 0 dan 99%." };
  if (!(input.targetHppPct > 0 && input.targetHppPct <= 100)) return { error: "Target HPP harus antara 1 dan 100%." };
  if (input.sellingPrice != null && input.sellingPrice < 0) return { error: "Harga jual tidak valid." };
  const itemError = validateItems(input.items);
  if (itemError) return { error: itemError };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_recipe", {
    p_id: input.id,
    p_recipe: {
      name: input.name,
      category: input.category,
      yield_qty: input.yieldQty,
      yield_unit: input.yieldUnit,
      waste_pct: input.wastePct,
      target_hpp_pct: input.targetHppPct,
      selling_price: input.sellingPrice == null ? null : Math.round(input.sellingPrice),
      is_active: input.isActive,
      notes: input.notes,
    },
    p_items: input.items.map((it) => ({
      ingredient_id: it.kind === "ingredient" ? it.id : null,
      sub_recipe_id: it.kind === "recipe" ? it.id : null,
      quantity: it.quantity,
      unit: it.unit,
    })),
  });
  if (error) return { error: friendlyError(error) };
  refresh();
  redirect(`/app/resep/${id}`);
}

export async function duplicateRecipe(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: newId, error } = await supabase.rpc("duplicate_recipe", { p_id: id });
  if (error) return { error: friendlyError(error) };
  refresh();
  redirect(`/app/resep/${newId}/ubah`);
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("recipes").delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus resep." };
  refresh();
  redirect("/app/resep");
}

// ---- Bundles ----------------------------------------------------------------

export interface BundleInput {
  id: string | null;
  name: string;
  sellingPrice: number | null;
  targetHppPct: number;
  isActive: boolean;
  notes: string;
  items: ItemInput[];
}

export async function saveBundle(input: BundleInput): Promise<ActionResult> {
  if (!input.name.trim()) return { error: "Nama paket wajib diisi." };
  if (!(input.targetHppPct > 0 && input.targetHppPct <= 100)) return { error: "Target HPP harus antara 1 dan 100%." };
  if (input.sellingPrice != null && input.sellingPrice < 0) return { error: "Harga jual tidak valid." };
  const itemError = validateItems(input.items);
  if (itemError) return { error: itemError };

  const supabase = await createClient();
  const { data: id, error } = await supabase.rpc("save_bundle", {
    p_id: input.id,
    p_bundle: {
      name: input.name,
      selling_price: input.sellingPrice == null ? null : Math.round(input.sellingPrice),
      target_hpp_pct: input.targetHppPct,
      is_active: input.isActive,
      notes: input.notes,
    },
    p_items: input.items.map((it) => ({
      recipe_id: it.kind === "recipe" ? it.id : null,
      ingredient_id: it.kind === "ingredient" ? it.id : null,
      quantity: it.quantity,
      unit: it.unit,
    })),
  });
  if (error) return { error: friendlyError(error) };
  refresh();
  redirect(`/app/paket/${id}`);
}

export async function deleteBundle(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bundles").delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus paket." };
  refresh();
  redirect("/app/paket");
}
