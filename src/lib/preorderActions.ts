"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { friendlyError } from "./errors";
import type { ActionResult } from "./actions";
import { normalizeWhatsapp, type FulfillMethod, type OrderStatus, type PaymentMethod } from "./preorder";

function refresh() {
  revalidatePath("/app", "layout");
}

// ---- Orders -------------------------------------------------------------------

export interface OrderInput {
  id: string | null;
  customer: { whatsapp: string; name: string; address: string; notes: string };
  campaignId: string | null;
  fulfillDate: string;
  fulfillMethod: FulfillMethod;
  deliveryAddress: string;
  shippingFee: number;
  discount: number;
  dpAmount: number;
  notes: string;
  items: { productId: string; qty: number; unitPrice: number }[];
}

export async function saveOrder(input: OrderInput): Promise<ActionResult> {
  const wa = normalizeWhatsapp(input.customer.whatsapp);
  if (!wa) return { error: "Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890." };
  if (!input.customer.name.trim()) return { error: "Nama pelanggan wajib diisi." };
  if (!input.items.length) return { error: "Pilih minimal 1 produk." };

  const supabase = await createClient();
  const { data: customerId, error: cErr } = await supabase.rpc("upsert_customer", {
    p_whatsapp: wa,
    p_name: input.customer.name,
    p_address: input.customer.address,
    p_notes: input.customer.notes,
  });
  if (cErr) return { error: friendlyError(cErr) };

  const { data: id, error } = await supabase.rpc("save_order", {
    p_id: input.id,
    p_order: {
      customer_id: customerId,
      campaign_id: input.campaignId,
      fulfill_date: input.fulfillDate,
      fulfill_method: input.fulfillMethod,
      delivery_address: input.fulfillMethod === "ambil" ? "" : input.deliveryAddress,
      shipping_fee: Math.round(input.shippingFee),
      discount: Math.round(input.discount),
      dp_amount: Math.round(input.dpAmount),
      notes: input.notes,
      status: input.dpAmount > 0 ? "menunggu_dp" : "baru",
    },
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty, unit_price: Math.round(i.unitPrice) })),
  });
  if (error) return { error: friendlyError(error) };
  refresh();
  redirect(input.id ? `/app/order/${id}` : `/app/order/${id}?baru=1`);
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk mengubah order ini." };
  refresh();
  return {};
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus order." };
  refresh();
  redirect("/app/order");
}

// ---- Payments -------------------------------------------------------------------

export interface PaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  proofPath: string | null;
  note: string;
}

export async function addPayment(input: PaymentInput): Promise<ActionResult> {
  if (!(input.amount > 0)) return { error: "Jumlah bayar harus lebih dari 0." };
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    order_id: input.orderId,
    amount: Math.round(input.amount),
    method: input.method,
    proof_path: input.proofPath,
    note: input.note.trim() || null,
  });
  if (error) return { error: friendlyError(error) };
  refresh();
  return {};
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments").delete().eq("id", id).select("proof_path");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus pembayaran." };
  const path = data[0].proof_path as string | null;
  if (path) await supabase.storage.from("payment-proofs").remove([path]);
  refresh();
  return {};
}

// ---- Customers -------------------------------------------------------------------

export interface CustomerInput {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  notes: string;
}

export async function saveCustomer(input: CustomerInput): Promise<ActionResult> {
  const wa = normalizeWhatsapp(input.whatsapp);
  if (!wa) return { error: "Nomor WhatsApp tidak valid." };
  if (!input.name.trim()) return { error: "Nama wajib diisi." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .update({ name: input.name.trim(), whatsapp: wa, address: input.address.trim() || null, notes: input.notes.trim() || null })
    .eq("id", input.id)
    .select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk mengubah pelanggan." };
  refresh();
  return {};
}

// ---- Products -------------------------------------------------------------------

export interface ProductInput {
  id: string | null;
  name: string;
  description: string;
  source: { kind: "recipe" | "bundle"; id: string };
  unitsPerProduct: number;
  price: number;
  weeklyCapacity: number | null;
  minLeadDays: number;
  preorderEnabled: boolean;
  showOnWebsite: boolean;
  isActive: boolean;
  photoPath: string | null;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  if (!input.name.trim()) return { error: "Nama produk wajib diisi." };
  if (!input.source.id) return { error: "Pilih resep atau paket." };
  if (!(input.unitsPerProduct > 0)) return { error: "Isi per produk harus lebih dari 0." };
  if (!(input.price >= 0)) return { error: "Harga tidak valid." };
  if (input.weeklyCapacity != null && !(Number.isInteger(input.weeklyCapacity) && input.weeklyCapacity > 0)) {
    return { error: "Kapasitas harus bilangan bulat > 0, atau kosongkan untuk tanpa batas." };
  }
  if (!(Number.isInteger(input.minLeadDays) && input.minLeadDays >= 0)) return { error: "Lead time harus bilangan bulat ≥ 0." };

  const row = {
    name: input.name.trim(),
    description: input.description.trim() || null,
    recipe_id: input.source.kind === "recipe" ? input.source.id : null,
    bundle_id: input.source.kind === "bundle" ? input.source.id : null,
    units_per_product: input.unitsPerProduct,
    price: Math.round(input.price),
    weekly_capacity: input.weeklyCapacity,
    min_lead_days: input.minLeadDays,
    preorder_enabled: input.preorderEnabled,
    show_on_website: input.showOnWebsite,
    is_active: input.isActive,
    photo_path: input.photoPath,
  };
  const supabase = await createClient();
  const res = input.id
    ? await supabase.from("products").update(row).eq("id", input.id).select("id")
    : await supabase.from("products").insert(row).select("id");
  if (res.error) return { error: friendlyError(res.error) };
  if (!res.data?.length) return { error: "Anda tidak punya akses untuk mengubah produk." };
  refresh();
  redirect("/app/produk");
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").delete().eq("id", id).select("photo_path");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus produk." };
  const path = data[0].photo_path as string | null;
  if (path) await supabase.storage.from("product-photos").remove([path]);
  refresh();
  redirect("/app/produk");
}

// ---- Campaigns -------------------------------------------------------------------

export interface CampaignInput {
  id: string | null;
  name: string;
  preorderOpen: string;
  preorderClose: string;
  fulfillStart: string;
  fulfillEnd: string;
  dpPercent: number | null;
  isActive: boolean;
  notes: string;
  products: { productId: string; priceOverride: number | null }[];
}

export async function saveCampaign(input: CampaignInput): Promise<ActionResult> {
  if (!input.name.trim()) return { error: "Nama campaign wajib diisi." };
  if (!input.preorderOpen || !input.preorderClose) return { error: "Isi tanggal buka dan tutup preorder." };
  if (input.preorderClose < input.preorderOpen) return { error: "Tanggal tutup harus setelah tanggal buka." };
  if (input.fulfillStart && input.fulfillEnd && input.fulfillEnd < input.fulfillStart) {
    return { error: "Tanggal akhir ambil/kirim harus setelah tanggal mulai." };
  }
  if (input.dpPercent != null && !(input.dpPercent >= 0 && input.dpPercent <= 100)) return { error: "DP harus 0–100%." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_campaign", {
    p_id: input.id,
    p_campaign: {
      name: input.name,
      preorder_open: input.preorderOpen,
      preorder_close: input.preorderClose,
      fulfill_start: input.fulfillStart,
      fulfill_end: input.fulfillEnd,
      dp_percent: input.dpPercent,
      is_active: input.isActive,
      notes: input.notes,
    },
    p_products: input.products.map((p) => ({ product_id: p.productId, price_override: p.priceOverride })),
  });
  if (error) return { error: friendlyError(error) };
  refresh();
  redirect("/app/campaign");
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("campaigns").delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk menghapus campaign." };
  refresh();
  redirect("/app/campaign");
}

// ---- Settings -------------------------------------------------------------------

export interface SettingsInput {
  businessName: string;
  businessWhatsapp: string;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  qrisNote: string;
  pickupAddress: string;
  defaultDpPercent: number;
}

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const wa = input.businessWhatsapp.trim() ? normalizeWhatsapp(input.businessWhatsapp) : null;
  if (input.businessWhatsapp.trim() && !wa) return { error: "Nomor WhatsApp usaha tidak valid." };
  if (!(input.defaultDpPercent >= 0 && input.defaultDpPercent <= 100)) return { error: "DP harus 0–100%." };
  const t = (s: string) => s.trim() || null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .update({
      business_name: input.businessName.trim() || "Mami I Pâtisserie",
      business_whatsapp: wa,
      bank_name: t(input.bankName),
      bank_account_no: t(input.bankAccountNo),
      bank_account_name: t(input.bankAccountName),
      qris_note: t(input.qrisNote),
      pickup_address: t(input.pickupAddress),
      default_dp_percent: input.defaultDpPercent,
    })
    .eq("id", true)
    .select("id");
  if (error) return { error: friendlyError(error) };
  if (!data?.length) return { error: "Anda tidak punya akses untuk mengubah pengaturan." };
  refresh();
  return {};
}
