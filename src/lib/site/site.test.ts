import { describe, expect, it } from "vitest";
import { addItem, cardNote, cartCount, lineKey, parseCart, setQty, type CartItem } from "./cart";
import { dateBounds, dpAmount, payNow, subtotal, validateDetails, type CheckoutDetails } from "./checkout";
import { daysUntil } from "@/content/campaigns";

describe("cart", () => {
  it("adds, merges per note and removes lines", () => {
    let c: CartItem[] = [];
    c = addItem(c, "risol");
    c = addItem(c, "risol", 2);
    c = addItem(c, "box", 1, "Untuk Tante: Selamat!");
    c = addItem(c, "box");
    expect(c.map((x) => [lineKey(x), x.qty])).toEqual([["risol|", 3], ["box|Untuk Tante: Selamat!", 1], ["box|", 1]]);
    expect(cartCount(c)).toBe(5);
    c = setQty(c, "risol|", 1);
    expect(c[0].qty).toBe(1);
    c = setQty(c, "box|", 0);
    expect(c).toHaveLength(2);
  });
  it("parses stored data defensively and drops unknown products", () => {
    const known = (id: string) => id !== "gone";
    expect(parseCart(null, known)).toEqual([]);
    expect(parseCart("not json", known)).toEqual([]);
    expect(parseCart('{"a":1}', known)).toEqual([]);
    expect(parseCart(JSON.stringify([{ productId: "a", qty: 2 }, { productId: "gone", qty: 1 }, { productId: "x", qty: -1 }]), known)).toEqual([
      { productId: "a", qty: 2, note: "" },
    ]);
  });
  it("builds the greeting card note", () => {
    expect(cardNote({ to: "Tante Rina", msg: "Selamat Natal!", from: "Dimas" })).toBe("Untuk Tante Rina: Selamat Natal! — Dimas");
    expect(cardNote({ to: "", msg: "Halo", from: "" })).toBe("Halo");
    expect(cardNote({ to: " ", msg: "", from: "" })).toBe("");
  });
});

describe("checkout", () => {
  it("rounds DP up to Rp 50.000 and caps it at the total", () => {
    expect(dpAmount(250_000, 40)).toBe(100_000); // 100.000 exactly
    expect(dpAmount(265_000, 40)).toBe(150_000); // 106.000 → 150.000
    expect(dpAmount(60_000, 40)).toBe(50_000);
    expect(dpAmount(30_000, 40)).toBe(30_000); // capped
    expect(dpAmount(0, 40)).toBe(0);
  });
  it("only offers DP when it is below the total", () => {
    expect(payNow(265_000, 150_000, "dp")).toBe(150_000);
    expect(payNow(265_000, 150_000, "lunas")).toBe(265_000);
    expect(payNow(30_000, 30_000, "dp")).toBe(30_000);
  });
  it("computes date bounds (H+2, campaign window)", () => {
    expect(dateBounds("2026-10-22", 2)).toEqual({ min: "2026-10-24", max: null });
    expect(dateBounds("2026-10-22", 2, { from: "2026-12-20", to: "2026-12-24" })).toEqual({ min: "2026-12-20", max: "2026-12-24" });
    expect(dateBounds("2026-12-19", 2, { from: "2026-12-20", to: "2026-12-24" })).toEqual({ min: "2026-12-21", max: "2026-12-24" });
  });
  it("validates details", () => {
    const ok: CheckoutDetails = { name: "Rina", whatsapp: "0812-3456-7890", method: "instan", area: "Cimahi", address: "Jl. A", date: "2026-10-25", slot: "", note: "" };
    const b = { min: "2026-10-24", max: null };
    expect(validateDetails(ok, b, 30_000)).toEqual({});
    expect(validateDetails({ ...ok, name: " ", whatsapp: "12345", date: "2026-10-23", address: "" }, b, null)).toEqual({
      name: true, whatsapp: true, date: true, address: true, area: true,
    });
    expect(validateDetails({ ...ok, method: "ambil", address: "", area: "" }, b, null)).toEqual({});
  });
  it("sums lines and counts days", () => {
    expect(subtotal([{ qty: 2, price: 28_000 }, { qty: 1, price: 250_000 }])).toBe(306_000);
    expect(daysUntil("2026-12-18T23:59:59+07:00", new Date("2026-10-22T12:00:00+07:00"))).toBe(58);
  });
});
