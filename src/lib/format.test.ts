import { describe, expect, it } from "vitest";
import { formatNumber, formatPercent, formatRupiah, parseNumberInput } from "./format";
import { toCsv } from "./csv";

describe("formatRupiah", () => {
  it("formats Indonesian style", () => {
    expect(formatRupiah(25000)).toBe("Rp 25.000");
    expect(formatRupiah(1234567.6)).toBe("Rp 1.234.568");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(-1500)).toBe("-Rp 1.500");
    expect(formatRupiah(null)).toBe("–");
    expect(formatRupiah(198.2378, 2)).toBe("Rp 198,24");
    expect(formatRupiah(14, 2)).toBe("Rp 14");
  });
  it("formats numbers and percent", () => {
    expect(formatNumber(1234.5, 2)).toBe("1.234,5");
    expect(formatNumber(-0.001, 0)).toBe("0");
    expect(formatPercent(34.567)).toBe("34,6%");
  });
});

describe("parseNumberInput", () => {
  it("accepts Indonesian and plain input", () => {
    expect(parseNumberInput("25.000")).toBe(25000);
    expect(parseNumberInput("Rp 1.250.000")).toBe(1250000);
    expect(parseNumberInput("25000")).toBe(25000);
    expect(parseNumberInput("1,5")).toBe(1.5);
    expect(parseNumberInput("0.5")).toBe(0.5);
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("abc")).toBeNull();
  });
});

describe("toCsv", () => {
  it("escapes and neutralizes formulas", () => {
    expect(toCsv([["a", 'b"c', "d,e"], [1, null, "=SUM(A1)"]])).toBe('a,"b""c","d,e"\r\n1,,\'=SUM(A1)\r\n');
  });
});
