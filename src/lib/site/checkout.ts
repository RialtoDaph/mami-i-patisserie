// Website checkout rules (pure). Source: docs/KEPUTUSAN.md + DATA.md of the design handoff.
// - DP = dp% of the total rounded UP to a multiple of Rp 50.000, capped at the total.
// - Pickup / delivery date at least H+2 (Asia/Jakarta). During the Christmas campaign: 20–24 Des.
// - Payment deadline 1 hour after checkout (enforced server-side in stage 6).

import { addDays } from "@/lib/preorder/dates";
import { normalizeWhatsapp } from "@/lib/preorder/phone";
import type { DeliveryMethod } from "@/content/shipping";

export function dpAmount(total: number, percent: number, round = 50_000): number {
  if (total <= 0) return 0;
  return Math.min(total, Math.ceil((total * percent) / 100 / round) * round);
}

export type PayPlan = "dp" | "lunas";

/** Amount due now; DP is only offered when it is less than the total. */
export function payNow(total: number, dp: number, plan: PayPlan): number {
  return plan === "dp" && dp < total ? dp : total;
}

export function dateBounds(today: string, leadDays: number, campaignWindow?: { from: string; to: string }): { min: string; max: string | null } {
  const earliest = addDays(today, leadDays);
  if (!campaignWindow) return { min: earliest, max: null };
  return { min: earliest > campaignWindow.from ? earliest : campaignWindow.from, max: campaignWindow.to };
}

export interface CheckoutDetails {
  name: string;
  whatsapp: string;
  method: DeliveryMethod;
  area: string;
  address: string;
  date: string;
  slot: string;
  note: string;
}

export type DetailErrors = Partial<Record<"name" | "whatsapp" | "date" | "address" | "area", true>>;

export function validateDetails(d: CheckoutDetails, bounds: { min: string; max: string | null }, areaFee: number | null): DetailErrors {
  const e: DetailErrors = {};
  if (!d.name.trim()) e.name = true;
  if (!normalizeWhatsapp(d.whatsapp) || !/^(0|62|\+62)?\s*8/.test(d.whatsapp.replace(/[\s-]/g, ""))) e.whatsapp = true;
  if (!d.date || d.date < bounds.min || (bounds.max != null && d.date > bounds.max)) e.date = true;
  if (d.method !== "ambil") {
    if (!d.address.trim()) e.address = true;
    if (areaFee == null) e.area = true;
  }
  return e;
}

export interface PricedLine {
  qty: number;
  price: number;
}

export function subtotal(lines: PricedLine[]): number {
  return lines.reduce((s, l) => s + l.qty * l.price, 0);
}
