import { describe, expect, it } from "vitest";
import { capacityFor, capacityViolations, weeklyUsed } from "./capacity";
import { order, products } from "./fixtures";

const box = products[2]; // capacity 5
const orders = [
  order({ id: "a", fulfillDate: "2026-10-05", items: [{ productId: "box", qty: 2, unitPrice: 250000 }] }), // Mon
  order({ id: "b", fulfillDate: "2026-10-11", items: [{ productId: "box", qty: 2, unitPrice: 250000 }] }), // Sun, same week
  order({ id: "c", fulfillDate: "2026-10-12", items: [{ productId: "box", qty: 5, unitPrice: 250000 }] }), // next week
  order({ id: "d", fulfillDate: "2026-10-07", status: "batal", items: [{ productId: "box", qty: 5, unitPrice: 250000 }] }),
  order({ id: "e", fulfillDate: "2026-10-04", items: [{ productId: "box", qty: 5, unitPrice: 250000 }] }), // previous Sunday
];

describe("weekly capacity", () => {
  it("counts the Mon–Sun week and ignores cancelled orders", () => {
    expect(weeklyUsed(orders, "box", "2026-10-08")).toBe(4);
    expect(weeklyUsed(orders, "box", "2026-10-12")).toBe(5);
    expect(weeklyUsed(orders, "box", "2026-10-08", "a")).toBe(2); // editing order a
  });

  it("reports remaining and full", () => {
    expect(capacityFor(box, orders, "2026-10-06")).toEqual({ capacity: 5, used: 4, remaining: 1, full: false, weekStart: "2026-10-05" });
    expect(capacityFor(box, orders, "2026-10-13").full).toBe(true);
    expect(capacityFor(products[3], orders, "2026-10-06")).toMatchObject({ capacity: null, remaining: null, full: false });
  });

  it("blocks orders that exceed the remaining quota", () => {
    expect(capacityViolations([{ productId: "box", qty: 1 }], "2026-10-06", products, orders)).toEqual([]);
    expect(capacityViolations([{ productId: "box", qty: 2 }], "2026-10-06", products, orders)).toEqual([
      { productId: "box", name: "Blessings Box", capacity: 5, used: 4, requested: 2 },
    ]);
    // Same product on two lines adds up.
    expect(capacityViolations([{ productId: "box", qty: 1 }, { productId: "box", qty: 1 }], "2026-10-06", products, orders)).toHaveLength(1);
    // Editing an existing order does not count itself.
    expect(capacityViolations([{ productId: "box", qty: 3 }], "2026-10-06", products, orders, "a")).toEqual([]);
    // Unlimited products never block.
    expect(capacityViolations([{ productId: "unlimited", qty: 9999 }], "2026-10-06", products, orders)).toEqual([]);
  });
});
