import { describe, expect, it } from "vitest";
import { campaignUsed, currentCampaign, dailyRevenue, dueOn, lateDps, monthRange, ordersBetween } from "./home";
import { canSetStatus, lowStock, stockState } from "./kitchen";
import { lebaran, order } from "./fixtures";

const item = (productId: string, qty: number, unitPrice = 10000) => ({ productId, qty, unitPrice });

describe("monthRange", () => {
  it("covers the whole month", () => {
    expect(monthRange("2026-10-24")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(monthRange("2027-02-10")).toEqual({ from: "2027-02-01", to: "2027-02-28" });
  });
});

describe("revenue", () => {
  const orders = [
    order({ fulfillDate: "2026-10-20", items: [item("croissant", 2)] }),
    order({ fulfillDate: "2026-10-24", items: [item("croissant", 1)] }),
    order({ fulfillDate: "2026-10-24", items: [item("croissant", 5)], status: "batal" }),
    order({ fulfillDate: "2026-11-02", items: [item("croissant", 1)] }),
  ];
  it("counts non-cancelled orders by fulfil date", () => {
    expect(ordersBetween(orders, "2026-10-01", "2026-10-31").reduce((s, o) => s + o.total, 0)).toBe(30000);
  });
  it("gives one point per day ending today", () => {
    const d = dailyRevenue(orders, "2026-10-24", 5);
    expect(d.map((x) => x.total)).toEqual([20000, 0, 0, 0, 10000]);
    expect(d[0].date).toBe("2026-10-20");
  });
});

describe("lateDps", () => {
  it("lists short DPs that are old or due soon", () => {
    const old = order({ fulfillDate: "2026-11-20", items: [item("box", 1, 250000)], dpAmount: 100000, createdAt: "2026-10-20T03:00:00Z" });
    const soon = order({ fulfillDate: "2026-10-26", items: [item("box", 1, 250000)], dpAmount: 100000, amountPaid: 50000, createdAt: "2026-10-24T03:00:00Z" });
    const fresh = order({ fulfillDate: "2026-11-20", items: [item("box", 1, 250000)], dpAmount: 100000, createdAt: "2026-10-24T03:00:00Z" });
    const paid = order({ fulfillDate: "2026-10-26", items: [item("box", 1, 250000)], dpAmount: 100000, amountPaid: 100000 });
    const r = lateDps([old, soon, fresh, paid], "2026-10-24");
    expect(r.map((x) => [x.order.id, x.short])).toEqual([[soon.id, 50000], [old.id, 100000]]);
  });
});

describe("campaigns", () => {
  it("counts campaign boxes and picks the open campaign", () => {
    const orders = [
      order({ fulfillDate: "2027-03-05", campaignId: "lebaran", items: [item("box", 2), item("croissant", 3)] }),
      order({ fulfillDate: "2027-03-06", campaignId: "lebaran", items: [item("risolFrozen", 1)], status: "batal" }),
    ];
    expect(campaignUsed(lebaran, orders)).toBe(2);
    expect(currentCampaign([lebaran], "2027-02-01")).toBe(lebaran);
    expect(currentCampaign([lebaran], "2026-10-24")).toBe(lebaran);
    expect(currentCampaign([lebaran], "2027-04-01")).toBeNull();
  });
  it("finds orders due on a date", () => {
    const a = order({ fulfillDate: "2026-10-24", items: [item("box", 1)] });
    const b = order({ fulfillDate: "2026-10-24", items: [item("box", 1)], status: "selesai" });
    expect(dueOn([a, b], "2026-10-24")).toEqual([a]);
  });
});

describe("kitchen", () => {
  it("flags stock under the minimum and uncounted items", () => {
    expect(stockState({ stockQty: 500, minStock: 1000 })).toBe("kurang");
    expect(stockState({ stockQty: null, minStock: 1000 })).toBe("belum_dihitung");
    expect(stockState({ stockQty: 1000, minStock: 1000 })).toBe("cukup");
    expect(stockState({ stockQty: 0, minStock: null })).toBe("tanpa_minimum");
    const r = lowStock([
      { id: "a", name: "Telur", stockQty: null, minStock: 30 },
      { id: "b", name: "Butter", stockQty: 200, minStock: 1000 },
      { id: "c", name: "Gula", stockQty: 5000, minStock: 1000 },
    ]);
    expect(r.map((x) => [x.name, x.state])).toEqual([["Butter", "kurang"], ["Telur", "belum_dihitung"]]);
  });
  it("lets the pastry chef only move orders to diproduksi or siap", () => {
    expect(canSetStatus("produksi", "siap")).toBe(true);
    expect(canSetStatus("produksi", "selesai")).toBe(false);
    expect(canSetStatus("admin", "batal")).toBe(true);
    expect(canSetStatus("manager", "siap")).toBe(false);
  });
});

describe("countUnit", () => {
  it("counts grams in kg, ml in liter and pieces as pieces", async () => {
    const { countUnit } = await import("./kitchen");
    expect(countUnit("g")).toEqual({ factor: 1000, label: "kg" });
    expect(countUnit("ml")).toEqual({ factor: 1000, label: "liter" });
    expect(countUnit("pcs")).toEqual({ factor: 1, label: "pcs" });
  });
});
