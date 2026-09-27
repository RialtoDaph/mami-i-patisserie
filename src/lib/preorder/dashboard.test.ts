import { describe, expect, it } from "vitest";
import { dashboardStats, orderCountByCustomer } from "./dashboard";
import { filterOrders } from "./filters";
import { customers, order, products } from "./fixtures";

const orders = [
  order({ id: "1", orderNo: "MIP-0001", customerId: "rina", campaignId: "lebaran", fulfillDate: "2026-10-01", status: "dp_diterima", dpAmount: 100000, amountPaid: 100000, items: [{ productId: "risolFrozen", qty: 2, unitPrice: 75000 }, { productId: "croissant", qty: 1, unitPrice: 58000 }] }),
  order({ id: "2", orderNo: "MIP-0002", customerId: "budi", fulfillDate: "2026-10-02", status: "baru", dpAmount: 150000, amountPaid: 50000, shippingFee: 25000, items: [{ productId: "box", qty: 1, unitPrice: 250000 }] }),
  order({ id: "3", orderNo: "MIP-0003", customerId: "rina", campaignId: "lebaran", fulfillDate: "2026-10-05", status: "selesai", dpAmount: 0, amountPaid: 150000, items: [{ productId: "risolFrozen", qty: 2, unitPrice: 75000 }] }),
  order({ id: "4", orderNo: "MIP-0004", customerId: "budi", fulfillDate: "2026-10-05", status: "batal", items: [{ productId: "box", qty: 3, unitPrice: 250000 }] }),
];

describe("dashboardStats", () => {
  const s = dashboardStats(orders, products, customers);
  it("sums non-cancelled orders", () => {
    expect(s.orderCount).toBe(3);
    expect(s.cancelledCount).toBe(1);
    expect(s.revenue).toBe(208000 + 275000 + 150000);
    expect(s.paid).toBe(300000);
    expect(s.outstanding).toBe(108000 + 225000);
  });
  it("tracks unpaid DP", () => {
    expect(s.dpPendingCount).toBe(1);
    expect(s.dpPendingAmount).toBe(100000);
  });
  it("ranks products and finds repeat customers", () => {
    expect(s.topProducts[0]).toEqual({ productId: "risolFrozen", name: "Risol Frozen isi 10", qty: 4, revenue: 300000 });
    expect(s.topProducts.map((p) => p.productId)).not.toContain("unlimited");
    expect(s.repeatCustomers).toEqual([{ customerId: "rina", name: "Bu Rina", orderCount: 2, total: 358000 }]);
    // Cancelled orders do not count toward repeat status.
    expect(orderCountByCustomer(orders).get("budi")).toBe(1);
    expect(s.byStatus.batal).toBe(1);
  });
});

describe("filterOrders", () => {
  it("filters by campaign, status, date range and text", () => {
    expect(filterOrders(orders, customers, { campaignId: "lebaran" }).map((o) => o.id)).toEqual(["1", "3"]);
    expect(filterOrders(orders, customers, { campaignId: "none" }).map((o) => o.id)).toEqual(["2", "4"]);
    expect(filterOrders(orders, customers, { status: "aktif" }).map((o) => o.id)).toEqual(["1", "2"]);
    expect(filterOrders(orders, customers, { status: "batal" }).map((o) => o.id)).toEqual(["4"]);
    expect(filterOrders(orders, customers, { from: "2026-10-02", to: "2026-10-04" }).map((o) => o.id)).toEqual(["2"]);
    expect(filterOrders(orders, customers, { q: "budi" }).map((o) => o.id)).toEqual(["2", "4"]);
    expect(filterOrders(orders, customers, { q: "0003" }).map((o) => o.id)).toEqual(["3"]);
    expect(filterOrders(orders, customers, { q: "0822" }).map((o) => o.id)).toEqual(["2", "4"]);
  });
});
