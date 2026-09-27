import { describe, expect, it } from "vitest";
import { confirmationMessage, paymentReminderMessage, readyMessage, shippedMessage, waLink } from "./whatsapp";
import { customers, order, settings } from "./fixtures";

const o = order({
  orderNo: "MIP-0007", fulfillDate: "2027-03-05", fulfillMethod: "kirim_instan", deliveryAddress: "Jl. Dago 10",
  shippingFee: 25000, discount: 10000, dpAmount: 100000, amountPaid: 0,
  items: [{ productId: "risolFrozen", qty: 2, unitPrice: 70000 }, { productId: "box", qty: 1, unitPrice: 250000 }],
});
const ctx = { order: o, customer: customers[0], settings, productName: (id: string) => ({ risolFrozen: "Risol Frozen isi 10", box: "Blessings Box" })[id] ?? id };

describe("WhatsApp messages", () => {
  it("builds a wa.me link with encoded text", () => {
    expect(waLink("6281111111111", "Halo & terima kasih")).toBe("https://wa.me/6281111111111?text=Halo%20%26%20terima%20kasih");
  });
  it("confirmation lists items, totals, date and DP instructions", () => {
    const m = confirmationMessage(ctx);
    expect(m).toContain("Halo Bu Rina");
    expect(m).toContain("*MIP-0007*");
    expect(m).toContain("• 2x Risol Frozen isi 10 — Rp 140.000");
    expect(m).toContain("Ongkir: Rp 25.000");
    expect(m).toContain("Diskon: -Rp 10.000");
    expect(m).toContain("*Total: Rp 405.000*");
    expect(m).toContain("Jum, 5 Mar 2027 (Kirim instan)");
    expect(m).toContain("Mohon DP *Rp 100.000*");
    expect(m).toContain("Transfer ke BCA 1234567890 a.n. Mami");
  });
  it("confirmation shows the balance once DP is paid", () => {
    const m = confirmationMessage({ ...ctx, order: { ...o, amountPaid: 100000 } });
    expect(m).not.toContain("Mohon DP");
    expect(m).toContain("Sisa: Rp 305.000");
  });
  it("reminder shows what is left", () => {
    const m = paymentReminderMessage({ ...ctx, order: { ...o, amountPaid: 100000 } });
    expect(m).toContain("*Sisa: Rp 305.000*");
  });
  it("ready message depends on pickup vs delivery", () => {
    expect(readyMessage({ ...ctx, order: { ...o, fulfillMethod: "ambil", amountPaid: o.total } })).toContain("Silakan diambil di Jl. Contoh 1, Bandung.");
    const d = readyMessage(ctx);
    expect(d).toContain("segera kami kirim");
    expect(d).toContain("Sisa pembayaran: *Rp 405.000*");
    expect(shippedMessage(ctx)).toContain("lewat kurir instan");
  });
});
