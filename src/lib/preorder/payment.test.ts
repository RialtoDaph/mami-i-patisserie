import { describe, expect, it } from "vitest";
import { dpOutstanding, dpPercentFor, paymentStatus, remainingOf, subtotalOf, suggestedDp, totalOf } from "./payment";
import { unitPriceFor } from "./pricing";
import { lebaran, products, settings } from "./fixtures";

describe("order totals", () => {
  it("computes subtotal and total with shipping and discount", () => {
    const items = [{ qty: 2, unitPrice: 75000 }, { qty: 1, unitPrice: 58000 }];
    expect(subtotalOf(items)).toBe(208000);
    expect(totalOf(308000, 30000, 10000)).toBe(328000);
    expect(subtotalOf([])).toBe(0);
  });
});

describe("DP", () => {
  it("uses the campaign percent, else the default", () => {
    expect(dpPercentFor(lebaran, settings)).toBe(50);
    expect(dpPercentFor({ dpPercent: 30 }, settings)).toBe(30);
    expect(dpPercentFor({ dpPercent: null }, settings)).toBe(50);
    expect(dpPercentFor(null, { defaultDpPercent: 40 })).toBe(40);
  });
  it("rounds the suggested DP up to Rp 1.000 and caps at total", () => {
    expect(suggestedDp(208000, 50)).toBe(104000);
    expect(suggestedDp(325000, 50)).toBe(163000); // 162.500 → 163.000
    expect(suggestedDp(328000, 33)).toBe(109000); // 108.240 → 109.000
    expect(suggestedDp(500, 50)).toBe(500); // capped at total
    expect(suggestedDp(100000, 0)).toBe(0);
    expect(suggestedDp(0, 50)).toBe(0);
    expect(suggestedDp(300000, 100)).toBe(300000);
  });
});

describe("payment status", () => {
  it("covers every state", () => {
    expect(paymentStatus(200000, 100000, 0)).toBe("belum_bayar");
    expect(paymentStatus(200000, 100000, 50000)).toBe("dp_kurang");
    expect(paymentStatus(200000, 100000, 100000)).toBe("dp_ok");
    expect(paymentStatus(200000, 100000, 150000)).toBe("dp_ok");
    expect(paymentStatus(200000, 100000, 200000)).toBe("lunas");
    expect(paymentStatus(200000, 100000, 250000)).toBe("lebih_bayar");
    expect(paymentStatus(200000, 0, 10000)).toBe("dp_ok");
    expect(paymentStatus(0, 0, 0)).toBe("lunas");
  });
  it("computes what is still owed", () => {
    expect(remainingOf(328000, 170000)).toBe(158000);
    expect(remainingOf(100000, 120000)).toBe(0);
    expect(dpOutstanding(150000, 100000)).toBe(50000);
    expect(dpOutstanding(150000, 200000)).toBe(0);
  });
});

describe("unitPriceFor", () => {
  it("uses the campaign override when set", () => {
    expect(unitPriceFor(products[0], lebaran)).toBe(70000);
    expect(unitPriceFor(products[2], lebaran)).toBe(250000); // override null
    expect(unitPriceFor(products[1], lebaran)).toBe(58000); // not in campaign
    expect(unitPriceFor(products[0], null)).toBe(75000);
  });
});
