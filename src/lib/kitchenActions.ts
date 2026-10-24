"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./supabase/server";
import { friendlyError } from "./errors";
import { parseNumberInput } from "./format";
import { isIsoDate, WASTE_REASON_LABEL, type WasteReason } from "./preorder";
import type { ActionResult } from "./actions";

function refresh() {
  revalidatePath("/app", "layout");
}

/**
 * Saves a manual stock count and/or minimum. Values are typed in the counting unit (kg, liter or pcs, see countUnit)
 * and stored in the base unit: base = value × factor (sent as pack_size). Empty minimum = no minimum.
 */
export async function saveStock(_prev: ActionResult & { savedAt?: number }, formData: FormData): Promise<ActionResult & { savedAt?: number }> {
  const id = String(formData.get("id") ?? "");
  const packSize = Number(formData.get("pack_size"));
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const minRaw = String(formData.get("min") ?? "").trim();
  if (!id || !(packSize > 0)) return { error: "Data bahan tidak lengkap." };
  const stock = stockRaw === "" ? null : parseNumberInput(stockRaw);
  const min = minRaw === "" ? null : parseNumberInput(minRaw);
  if ((stockRaw !== "" && (stock == null || stock < 0)) || (minRaw !== "" && (min == null || min < 0))) {
    return { error: "Isi angka 0 atau lebih (pakai koma untuk desimal)." };
  }
  const prevStock = String(formData.get("prev_stock") ?? "");
  const patch: Record<string, unknown> = { min_stock: min == null ? null : Math.round(min * packSize * 1000) / 1000 };
  // Only a changed count refreshes "dihitung" (saving just the minimum keeps the old count date).
  if (stockRaw !== prevStock) {
    patch.stock_qty = stock == null ? null : Math.round(stock * packSize * 1000) / 1000;
    patch.stock_counted_at = stock == null ? null : new Date().toISOString();
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("ingredients").update(patch).eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk mengubah stok." };
  refresh();
  return { savedAt: Date.now() };
}

/** "Selesai dibuat" tick for a product on a production date. */
export async function setProductionMark(date: string, productId: string, done: boolean): Promise<ActionResult> {
  if (!isIsoDate(date)) return { error: "Tanggal tidak valid." };
  const supabase = await createClient();
  const { error } = done
    ? await supabase.from("production_marks").upsert({ production_date: date, product_id: productId }, { onConflict: "production_date,product_id", ignoreDuplicates: true })
    : await supabase.from("production_marks").delete().eq("production_date", date).eq("product_id", productId);
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}

const REASONS = Object.keys(WASTE_REASON_LABEL) as WasteReason[];

/** Logs waste: a product (qty in product units) or an ingredient (qty typed in kg / liter / pcs, see countUnit). */
export async function addWaste(_prev: ActionResult & { savedAt?: number }, formData: FormData): Promise<ActionResult & { savedAt?: number }> {
  const item = String(formData.get("item") ?? "");
  const [kind, id] = item.split(":");
  const qty = parseNumberInput(String(formData.get("qty") ?? ""));
  const reason = String(formData.get("reason") ?? "") as WasteReason;
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  const date = String(formData.get("date") ?? "");
  const packSize = Number(formData.get(`pack_${id}`) ?? 1) || 1;
  if ((kind !== "p" && kind !== "i") || !id) return { error: "Pilih produk atau bahan." };
  if (qty == null || qty <= 0) return { error: "Isi jumlah lebih dari 0." };
  if (!REASONS.includes(reason)) return { error: "Pilih alasan." };
  if (!isIsoDate(date)) return { error: "Tanggal tidak valid." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const { error } = await supabase.from("waste_logs").insert({
    waste_date: date,
    product_id: kind === "p" ? id : null,
    ingredient_id: kind === "i" ? id : null,
    qty: kind === "i" ? Math.round(qty * packSize * 1000) / 1000 : qty,
    reason,
    note: note || null,
    created_by: auth?.claims?.sub,
  });
  if (error) return { error: friendlyError(error) };
  refresh();
  return { savedAt: Date.now() };
}

export async function deleteWaste(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("waste_logs").delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Catatan ini tidak bisa dihapus lagi (hanya di hari yang sama, atau oleh Owner)." };
  refresh();
  return {};
}
