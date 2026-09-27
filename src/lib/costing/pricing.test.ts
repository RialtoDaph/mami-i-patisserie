import { describe, expect, it } from "vitest";
import { grossMargin, hppPct, hppStatus, roundUpTo, suggestedPrice, withPbjt } from "./pricing";

describe("hppPct", () => {
  it("is cost / price in percent", () => {
    expect(hppPct(3500, 10000)).toBeCloseTo(35);
    expect(hppPct(3500, null)).toBeNull();
    expect(hppPct(3500, 0)).toBeNull();
  });
});

describe("suggestedPrice", () => {
  it("rounds up to Rp 1.000", () => {
    expect(suggestedPrice(2810.94, 35, 1000)).toBe(9000);
  });
  it("rounds up to Rp 500", () => {
    expect(suggestedPrice(2810.94, 35, 500)).toBe(8500);
  });
  it("does not bump exact multiples because of float noise", () => {
    // 3500 / 0.35 = 10000.000000000002 in naive float math
    expect(suggestedPrice(3500, 35, 1000)).toBe(10000);
    expect(suggestedPrice(3500, 35, 500)).toBe(10000);
  });
  it("rejects a zero target", () => {
    expect(() => suggestedPrice(1000, 0, 500)).toThrow();
  });
  it("roundUpTo keeps exact multiples", () => {
    expect(roundUpTo(1500, 500)).toBe(1500);
    expect(roundUpTo(1501, 500)).toBe(2000);
    expect(roundUpTo(0, 1000)).toBe(0);
  });
});

describe("grossMargin", () => {
  it("is price minus cost", () => {
    expect(grossMargin(2811, 7000)).toBe(4189);
    expect(grossMargin(8000, 7000)).toBe(-1000);
    expect(grossMargin(2811, null)).toBeNull();
  });
});

describe("withPbjt", () => {
  it("adds 10% and rounds to whole Rupiah", () => {
    expect(withPbjt(25000)).toBe(27500);
    expect(withPbjt(7000)).toBe(7700);
    expect(withPbjt(1234)).toBe(1357);
  });
});

describe("hppStatus", () => {
  it("is green at or below target, red above", () => {
    expect(hppStatus(30, 35)).toBe("under");
    expect(hppStatus(35, 35)).toBe("under");
    expect(hppStatus(35.0000000001, 35)).toBe("under");
    expect(hppStatus(35.1, 35)).toBe("over");
    expect(hppStatus(null, 35)).toBe("unknown");
  });
});
