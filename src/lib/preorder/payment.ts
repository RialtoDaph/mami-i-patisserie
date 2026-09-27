import type { Campaign, OrderItem, Settings } from "./types";

export type PaymentStatus = "belum_bayar" | "dp_kurang" | "dp_ok" | "lunas" | "lebih_bayar";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  belum_bayar: "Belum bayar",
  dp_kurang: "DP kurang",
  dp_ok: "DP diterima",
  lunas: "Lunas",
  lebih_bayar: "Lebih bayar",
};

export function subtotalOf(items: Pick<OrderItem, "qty" | "unitPrice">[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
}

/** Total = subtotal + shipping − discount. Mirrors orders.total in SQL. */
export function totalOf(subtotal: number, shippingFee: number, discount: number): number {
  return subtotal + shippingFee - discount;
}

/** DP percent for an order: campaign override, else the global default. */
export function dpPercentFor(campaign: Pick<Campaign, "dpPercent"> | null, settings: Pick<Settings, "defaultDpPercent">): number {
  return campaign?.dpPercent ?? settings.defaultDpPercent;
}

/** Suggested DP = total × percent, rounded up to Rp 1.000, never above the total. */
export function suggestedDp(total: number, percent: number): number {
  if (total <= 0 || percent <= 0) return 0;
  const raw = Math.round(((total * percent) / 100) * 1e6) / 1e6;
  return Math.min(total, Math.ceil(raw / 1000) * 1000);
}

export function remainingOf(total: number, paid: number): number {
  return Math.max(0, total - paid);
}

export function paymentStatus(total: number, dpAmount: number, paid: number): PaymentStatus {
  if (paid > total) return "lebih_bayar";
  if (paid === total) return "lunas";
  if (paid <= 0) return "belum_bayar";
  return paid >= dpAmount ? "dp_ok" : "dp_kurang";
}

/** DP still owed before production can be confirmed. */
export function dpOutstanding(dpAmount: number, paid: number): number {
  return Math.max(0, dpAmount - paid);
}
