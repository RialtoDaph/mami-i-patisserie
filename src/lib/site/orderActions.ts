"use server";

import { site } from "@/content/site";
import type { CheckoutDetails, PayPlan } from "./checkout";
import { anonClient } from "./data";

export interface WebOrderInput {
  items: { productId: string; qty: number; note: string }[];
  details: CheckoutDetails;
  plan: PayPlan;
  via: "qris" | "transfer";
}

export type WebOrderResult =
  | { ok: true; orderId: string; orderNo: string; token: string; total: number; payNow: number }
  | { ok: false; error: string };

/** Database rule messages are written for shoppers (Bahasa Indonesia); anything else gets a generic message. */
function friendly(e: { code?: string; message: string }): string {
  if (e.code === "23514" || e.code === "42501") return e.message.replace(/^PENUH: /, "Maaf, kuota penuh: ");
  console.error("web order failed", e);
  return "Pesanan belum bisa dikirim. Coba lagi sebentar, ya.";
}

/** Places a website order. Prices, fees, DP and quotas are all recomputed by place_web_order in the database. */
export async function placeWebOrder(input: WebOrderInput): Promise<WebOrderResult> {
  const sb = anonClient();
  if (!sb) return { ok: false, error: "Server belum tersambung." };
  const d = input.details;
  const { data, error } = await sb.rpc("place_web_order", {
    p: {
      name: d.name,
      whatsapp: d.whatsapp,
      method: d.method,
      area: d.method === "ambil" ? null : d.area,
      address: d.method === "ambil" ? null : d.address,
      date: d.date,
      slot: d.method === "ambil" ? d.slot : null,
      note: d.note,
      pay_mode: input.plan,
      pay_method: input.via,
      include_dummy: site.showDummy,
      items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty, card_note: i.note })),
    },
  });
  if (error) return { ok: false, error: friendly(error) };
  const r = data as Record<string, unknown>;
  return { ok: true, orderId: String(r.order_id), orderNo: String(r.order_no), token: String(r.token), total: Number(r.total), payNow: Number(r.pay_now) };
}

/** Links the uploaded proof (payment-proofs/web/<order>/<token>…) to the order as a pending payment. */
export async function attachWebPayment(orderId: string, token: string, path: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = anonClient();
  if (!sb) return { ok: false, error: "Server belum tersambung." };
  const { error } = await sb.rpc("attach_web_payment", { p_order_id: orderId, p_token: token, p_path: path });
  return error ? { ok: false, error: friendly(error) } : { ok: true };
}
