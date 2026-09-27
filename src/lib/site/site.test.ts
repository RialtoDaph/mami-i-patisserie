import { describe, expect, it } from "vitest";
import { addItem, cartTotals, lineKey, parseCart, setQty, type CartItem } from "./cart";
import { buildWhatsAppOrderMessage, earliestOrderDate, whatsAppUrl } from "./orderMessage";

const risol = { productId: "risol", name: "Risol Frozen isi 10", unitPrice: 75000, campaignId: null, campaignName: null, minLeadDays: 2 };
const boxLebaran = { productId: "box", name: "Blessings Box", unitPrice: 275000, campaignId: "leb", campaignName: "Lebaran 2027", minLeadDays: 3 };

describe("cart", () => {
  it("adds, merges and removes lines", () => {
    let c: CartItem[] = [];
    c = addItem(c, risol);
    c = addItem(c, risol, 2);
    c = addItem(c, boxLebaran);
    c = addItem(c, { ...boxLebaran, campaignId: null, campaignName: null, unitPrice: 250000 });
    expect(c.map((x) => [lineKey(x), x.qty])).toEqual([["risol:", 3], ["box:leb", 1], ["box:", 1]]);
    expect(cartTotals(c)).toEqual({ count: 5, total: 225000 + 275000 + 250000 });
    c = setQty(c, "risol:", 1);
    expect(c[0].qty).toBe(1);
    c = setQty(c, "box:", 0);
    expect(c).toHaveLength(2);
  });
  it("parses stored data defensively", () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart("not json")).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
    expect(parseCart(JSON.stringify([{ ...risol, qty: 2 }, { productId: "x", qty: -1 }]))).toEqual([{ ...risol, qty: 2 }]);
  });
});

describe("WhatsApp order message", () => {
  const cart = [{ ...risol, qty: 2 }, { ...boxLebaran, qty: 1 }];
  it("uses the longest lead time for the earliest date", () => {
    expect(earliestOrderDate(cart, "2027-02-26")).toBe("2027-03-01");
    expect(earliestOrderDate([], "2027-02-26")).toBe("2027-02-26");
  });
  it("lists items, total, date and delivery", () => {
    const m = buildWhatsAppOrderMessage({ cart, date: "2027-03-05", name: "Rina", delivery: "kirim", notes: "tanpa pedas" });
    expect(m).toContain("• 2x Risol Frozen isi 10 — Rp 150.000");
    expect(m).toContain("• 1x Blessings Box (Lebaran 2027) — Rp 275.000");
    expect(m).toContain("Total (3 item): *Rp 425.000*");
    expect(m).toContain("Campaign: Lebaran 2027");
    expect(m).toContain("Tanggal diinginkan: Jum, 5 Mar 2027");
    expect(m).toContain("Pengambilan: Dikirim");
    expect(m).toContain("Nama: Rina");
    expect(m).toContain("Catatan: tanpa pedas");
    expect(m).toContain("konfirmasi harga final");
  });
  it("handles a flexible date and no name", () => {
    const m = buildWhatsAppOrderMessage({ cart: [{ ...risol, qty: 1 }], date: null, name: " ", delivery: "ambil", notes: "" });
    expect(m).toContain("Tanggal diinginkan: fleksibel");
    expect(m).not.toContain("Nama:");
    expect(m).not.toContain("Campaign:");
  });
  it("builds wa.me links only for valid numbers", () => {
    expect(whatsAppUrl("0812-3456-7890", "Halo")).toBe("https://wa.me/6281234567890?text=Halo");
    expect(whatsAppUrl("+62 812 3456 7890", "a b")).toBe("https://wa.me/6281234567890?text=a%20b");
    expect(whatsAppUrl(undefined, "x")).toBeNull();
    expect(whatsAppUrl("123", "x")).toBeNull();
  });
});
