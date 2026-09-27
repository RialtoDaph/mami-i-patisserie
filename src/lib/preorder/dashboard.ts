import { paymentStatus, remainingOf } from "./payment";
import { ORDER_STATUSES } from "./status";
import type { Customer, Order, OrderStatus, Product } from "./types";

export interface DashboardStats {
  orderCount: number;
  cancelledCount: number;
  revenue: number;
  paid: number;
  outstanding: number;
  /** Open orders whose DP has not been fully paid. */
  dpPendingCount: number;
  dpPendingAmount: number;
  byStatus: Record<OrderStatus, number>;
  topProducts: { productId: string; name: string; qty: number; revenue: number }[];
  repeatCustomers: { customerId: string; name: string; orderCount: number; total: number }[];
}

/** Non-cancelled orders per customer. A customer with 2+ is a repeat customer. */
export function orderCountByCustomer(orders: Order[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const o of orders) if (o.status !== "batal") m.set(o.customerId, (m.get(o.customerId) ?? 0) + 1);
  return m;
}

export function isRepeatCustomer(orderCount: number): boolean {
  return orderCount >= 2;
}

export function dashboardStats(orders: Order[], products: Product[], customers: Customer[], topN = 5): DashboardStats {
  const active = orders.filter((o) => o.status !== "batal");
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>;
  for (const o of orders) byStatus[o.status]++;

  let dpPendingCount = 0;
  let dpPendingAmount = 0;
  for (const o of active) {
    const ps = paymentStatus(o.total, o.dpAmount, o.amountPaid);
    if (o.dpAmount > 0 && (ps === "belum_bayar" || ps === "dp_kurang")) {
      dpPendingCount++;
      dpPendingAmount += o.dpAmount - o.amountPaid;
    }
  }

  const productAgg = new Map<string, { qty: number; revenue: number }>();
  for (const o of active)
    for (const i of o.items) {
      const a = productAgg.get(i.productId) ?? { qty: 0, revenue: 0 };
      a.qty += i.qty;
      a.revenue += i.qty * i.unitPrice;
      productAgg.set(i.productId, a);
    }

  const customerTotal = new Map<string, number>();
  for (const o of active) customerTotal.set(o.customerId, (customerTotal.get(o.customerId) ?? 0) + o.total);

  return {
    orderCount: active.length,
    cancelledCount: orders.length - active.length,
    revenue: active.reduce((s, o) => s + o.total, 0),
    paid: active.reduce((s, o) => s + o.amountPaid, 0),
    outstanding: active.reduce((s, o) => s + remainingOf(o.total, o.amountPaid), 0),
    dpPendingCount,
    dpPendingAmount,
    byStatus,
    topProducts: [...productAgg]
      .map(([productId, a]) => ({ productId, name: products.find((p) => p.id === productId)?.name ?? "?", ...a }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, topN),
    repeatCustomers: [...orderCountByCustomer(orders)]
      .filter(([, n]) => isRepeatCustomer(n))
      .map(([customerId, orderCount]) => ({
        customerId,
        orderCount,
        name: customers.find((c) => c.id === customerId)?.name ?? "?",
        total: customerTotal.get(customerId) ?? 0,
      }))
      .sort((a, b) => b.orderCount - a.orderCount || b.total - a.total),
  };
}
