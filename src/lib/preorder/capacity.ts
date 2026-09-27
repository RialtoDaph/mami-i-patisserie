import { addDays, weekStart } from "./dates";
import type { Order, Product } from "./types";

export interface CapacityInfo {
  capacity: number | null;
  used: number;
  /** Null when unlimited. */
  remaining: number | null;
  full: boolean;
  weekStart: string;
}

/** Quantity of a product already booked in the Mon–Sun week containing `date` (cancelled orders excluded). */
export function weeklyUsed(orders: Order[], productId: string, date: string, excludeOrderId?: string | null): number {
  const start = weekStart(date);
  const end = addDays(start, 7);
  let used = 0;
  for (const o of orders) {
    if (o.status === "batal" || o.id === excludeOrderId) continue;
    if (o.fulfillDate < start || o.fulfillDate >= end) continue;
    for (const i of o.items) if (i.productId === productId) used += i.qty;
  }
  return used;
}

export function capacityFor(
  product: Pick<Product, "id" | "weeklyCapacity">,
  orders: Order[],
  date: string,
  excludeOrderId?: string | null,
): CapacityInfo {
  const used = weeklyUsed(orders, product.id, date, excludeOrderId);
  const capacity = product.weeklyCapacity;
  const remaining = capacity == null ? null : Math.max(0, capacity - used);
  return { capacity, used, remaining, full: remaining === 0, weekStart: weekStart(date) };
}

export interface CapacityViolation {
  productId: string;
  name: string;
  capacity: number;
  used: number;
  requested: number;
}

/** Products in a draft order that would exceed their weekly capacity. Mirrors check_order_capacity(). */
export function capacityViolations(
  items: { productId: string; qty: number }[],
  date: string,
  products: Product[],
  orders: Order[],
  excludeOrderId?: string | null,
): CapacityViolation[] {
  const requested = new Map<string, number>();
  for (const i of items) requested.set(i.productId, (requested.get(i.productId) ?? 0) + i.qty);

  const result: CapacityViolation[] = [];
  for (const [productId, qty] of requested) {
    const p = products.find((x) => x.id === productId);
    if (!p || p.weeklyCapacity == null) continue;
    const used = weeklyUsed(orders, productId, date, excludeOrderId);
    if (used + qty > p.weeklyCapacity) {
      result.push({ productId, name: p.name, capacity: p.weeklyCapacity, used, requested: qty });
    }
  }
  return result;
}
