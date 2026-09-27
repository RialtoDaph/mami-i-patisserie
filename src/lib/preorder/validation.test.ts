import { describe, expect, it } from "vitest";
import { earliestFulfillDate, validateOrderDraft, type OrderDraft } from "./validation";
import { lebaran, products } from "./fixtures";

const base: OrderDraft = {
  items: [{ productId: "risolFrozen", qty: 2, unitPrice: 75000 }],
  fulfillDate: "2026-10-01",
  fulfillMethod: "ambil",
  deliveryAddress: "",
  campaignId: null,
  shippingFee: 0,
  discount: 0,
  dpAmount: 75000,
};
const ctx = { products, campaign: null, today: "2026-09-27", checkDates: true };

describe("validateOrderDraft", () => {
  it("accepts a valid order", () => {
    expect(validateOrderDraft(base, ctx)).toEqual([]);
  });
  it("enforces the longest lead time", () => {
    expect(earliestFulfillDate(["risolFrozen", "box"], products, "2026-09-27")).toBe("2026-09-30");
    const d = { ...base, fulfillDate: "2026-09-29", items: [...base.items, { productId: "box", qty: 1, unitPrice: 250000 }] };
    expect(validateOrderDraft(d, ctx).join()).toMatch(/terlalu dekat/);
    expect(validateOrderDraft(d, { ...ctx, checkDates: false })).toEqual([]);
  });
  it("checks campaign window, dates and products", () => {
    const d = { ...base, campaignId: "lebaran", fulfillDate: "2027-02-25", items: [{ productId: "croissant", qty: 1, unitPrice: 58000 }], dpAmount: 0 };
    const errs = validateOrderDraft(d, { ...ctx, campaign: lebaran });
    expect(errs.join()).toMatch(/hanya dibuka/);
    expect(errs.join()).toMatch(/tidak termasuk campaign/);
    const inWindow = validateOrderDraft({ ...d, items: [{ productId: "risolFrozen", qty: 1, unitPrice: 70000 }], fulfillDate: "2027-03-10" }, { ...ctx, campaign: lebaran, today: "2027-02-01" });
    expect(inWindow.join()).toMatch(/harus antara/);
    expect(validateOrderDraft({ ...d, items: [{ productId: "risolFrozen", qty: 1, unitPrice: 70000 }] }, { ...ctx, campaign: lebaran, today: "2027-02-01" })).toEqual([]);
  });
  it("requires an address for delivery and sane money values", () => {
    expect(validateOrderDraft({ ...base, fulfillMethod: "kirim_instan" }, ctx).join()).toMatch(/Alamat/);
    expect(validateOrderDraft({ ...base, discount: 200000 }, ctx).join()).toMatch(/Diskon/);
    expect(validateOrderDraft({ ...base, dpAmount: 200000 }, ctx).join()).toMatch(/DP/);
    expect(validateOrderDraft({ ...base, items: [] }, ctx).join()).toMatch(/minimal 1/);
    expect(validateOrderDraft({ ...base, items: [{ productId: "risolFrozen", qty: 1.5, unitPrice: 1 }] }, ctx).join()).toMatch(/bulat/);
    expect(validateOrderDraft({ ...base, fulfillDate: "" }, ctx).join()).toMatch(/Pilih tanggal/);
  });
  it("rejects products that are not open for preorder", () => {
    const closed = products.map((p) => (p.id === "risolFrozen" ? { ...p, preorderEnabled: false } : p));
    expect(validateOrderDraft(base, { ...ctx, products: closed }).join()).toMatch(/tidak bisa dipreorder/);
  });
});
