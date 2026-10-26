// Beranda numbers (stage 5b). Pre-order revenue counts by fulfill date, cancelled orders excluded.
// Cafe revenue (Majoo) joins in stage 5f; targets in 5c.
import { addDays, daysBetween } from "./dates";
import { dpOutstanding } from "./payment";
import type { Campaign, Order } from "./types";

/** First and last day of the month containing `today`. */
export function monthRange(today: string): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(last).padStart(2, "0")}` };
}

const counts = (o: Order) => o.status !== "batal";

export function ordersBetween(orders: Order[], from: string, to: string): Order[] {
  return orders.filter((o) => counts(o) && o.fulfillDate >= from && o.fulfillDate <= to);
}

/** Pre-order revenue per day for `days` days ending on `today` (inclusive). */
export function dailyRevenue(orders: Order[], today: string, days = 30): { date: string; total: number }[] {
  const from = addDays(today, -(days - 1));
  const byDay = new Map<string, number>();
  for (const o of ordersBetween(orders, from, today)) byDay.set(o.fulfillDate, (byDay.get(o.fulfillDate) ?? 0) + o.total);
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    return { date, total: byDay.get(date) ?? 0 };
  });
}

export interface LateDp {
  order: Order;
  short: number;
}

/**
 * Open orders whose DP is still short and that need chasing: ordered 2+ days ago or due within 3 days.
 * Soonest fulfil date first.
 */
export function lateDps(orders: Order[], today: string): LateDp[] {
  return orders
    .filter((o) => counts(o) && o.status !== "selesai" && dpOutstanding(o.dpAmount, o.amountPaid) > 0)
    .filter((o) => daysBetween(o.createdAt.slice(0, 10), today) >= 2 || daysBetween(today, o.fulfillDate) <= 3)
    .map((order) => ({ order, short: dpOutstanding(order.dpAmount, order.amountPaid) }))
    .sort((a, b) => a.order.fulfillDate.localeCompare(b.order.fulfillDate) || a.order.orderNo.localeCompare(b.order.orderNo));
}

/** Boxes of a campaign's products in non-cancelled orders of that campaign. Mirrors public.campaign_used(). */
export function campaignUsed(campaign: Pick<Campaign, "id" | "products">, orders: Order[]): number {
  const ids = new Set(campaign.products.map((p) => p.productId));
  return orders
    .filter((o) => counts(o) && o.campaignId === campaign.id)
    .reduce((s, o) => s + o.items.filter((i) => ids.has(i.productId)).reduce((t, i) => t + i.qty, 0), 0);
}

/** The campaign shown on Beranda: open today, else the next one to open. */
export function currentCampaign<T extends Pick<Campaign, "preorderOpen" | "preorderClose" | "isActive">>(campaigns: T[], today: string): T | null {
  const live = campaigns.filter((c) => c.isActive);
  return (
    live.find((c) => c.preorderOpen <= today && today <= c.preorderClose) ??
    live.filter((c) => c.preorderOpen > today).sort((a, b) => a.preorderOpen.localeCompare(b.preorderOpen))[0] ??
    null
  );
}

/** Orders to hand over on a date that are not finished yet. */
export function dueOn(orders: Order[], date: string): Order[] {
  return orders.filter((o) => counts(o) && o.status !== "selesai" && o.fulfillDate === date);
}
