import type { Customer, Order, OrderStatus } from "./types";

export interface OrderFilter {
  campaignId?: string | null;
  status?: OrderStatus | "aktif" | null;
  from?: string | null;
  to?: string | null;
  q?: string | null;
}

/** Filters by campaign ("none" = without campaign), status ("aktif" = not done/cancelled), fulfill date range and text. */
export function filterOrders(orders: Order[], customers: Customer[], f: OrderFilter): Order[] {
  const byId = new Map(customers.map((c) => [c.id, c]));
  const q = f.q?.trim().toLowerCase();
  const qDigits = q?.replace(/\D/g, "");
  return orders.filter((o) => {
    if (f.campaignId === "none" ? o.campaignId !== null : f.campaignId && o.campaignId !== f.campaignId) return false;
    if (f.status === "aktif" ? o.status === "selesai" || o.status === "batal" : f.status && o.status !== f.status) return false;
    if (f.from && o.fulfillDate < f.from) return false;
    if (f.to && o.fulfillDate > f.to) return false;
    if (q) {
      const c = byId.get(o.customerId);
      const hit =
        o.orderNo.toLowerCase().includes(q) ||
        c?.name.toLowerCase().includes(q) ||
        (qDigits && qDigits.length >= 3 && c?.whatsapp.includes(qDigits.replace(/^0/, "")));
      if (!hit) return false;
    }
    return true;
  });
}
