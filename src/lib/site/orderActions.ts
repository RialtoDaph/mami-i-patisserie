"use server";

import { productById } from "@/content/catalog";
import { NATAL_2026 } from "@/content/campaigns";
import { DELIVERY_AREAS, type DeliveryMethod } from "@/content/shipping";
import { todayJakarta } from "@/lib/preorder/dates";
import { dateBounds, dpAmount, payNow, subtotal, validateDetails, type CheckoutDetails, type PayPlan } from "./checkout";
import { getSiteConfig } from "./config";

export interface WebOrderInput {
  items: { productId: string; qty: number; note: string }[];
  details: CheckoutDetails;
  plan: PayPlan;
  via: "qris" | "transfer";
}

export type WebOrderResult = { ok: true; ref: string; payNow: number; remaining: number } | { ok: false; error: string };

/**
 * Places a website order. Totals are recomputed here from the catalog; nothing from the browser is trusted.
 * STAGE 2: the orders table / proof upload are wired in stage 4. Until then this only answers in development
 * (DEMO reference) and refuses in production, so nobody thinks an order went through.
 */
export async function placeWebOrder(input: WebOrderInput): Promise<WebOrderResult> {
  const cfg = getSiteConfig();
  const lines = input.items.map((i) => ({ product: productById(i.productId), qty: Math.floor(i.qty) }));
  if (!lines.length || lines.some((l) => !l.product || !(l.qty > 0))) return { ok: false, error: "Keranjang tidak valid. Muat ulang halaman, ya." };

  const method: DeliveryMethod = input.details.method;
  const fee = method === "ambil" ? 0 : (DELIVERY_AREAS[method].find((a) => a.area === input.details.area)?.fee ?? null);
  const window = cfg.modeNatal ? { from: NATAL_2026.fulfilFrom, to: NATAL_2026.fulfilTo } : undefined;
  const errors = validateDetails(input.details, dateBounds(todayJakarta(), cfg.minLeadDays, window), fee);
  if (Object.keys(errors).length) return { ok: false, error: "Data pemesan belum lengkap." };

  const total = subtotal(lines.map((l) => ({ qty: l.qty, price: l.product!.price }))) + (fee ?? 0);
  const now = payNow(total, dpAmount(total, cfg.dpPercent, cfg.dpRound), input.plan);

  if (process.env.NODE_ENV === "production") return { ok: false, error: "Pemesanan online belum dibuka. Chat admin lewat WhatsApp, ya." };
  return { ok: true, ref: `DEMO-${String(Date.now()).slice(-5)}`, payNow: now, remaining: total - now };
}
