import { formatRupiah } from "../format";
import { addDays, formatDateId } from "../preorder/dates";
import { cartTotals, type CartItem } from "./cart";

export type DeliveryChoice = "ambil" | "kirim";

/** Earliest date a customer may ask for, given the longest lead time in the cart. */
export function earliestOrderDate(cart: Pick<CartItem, "minLeadDays">[], today: string): string {
  return addDays(today, Math.max(0, ...cart.map((c) => c.minLeadDays)));
}

export interface OrderRequest {
  cart: CartItem[];
  date: string | null;
  name: string;
  delivery: DeliveryChoice;
  notes: string;
}

/** WhatsApp message a customer sends to order. Prices are indicative; admin confirms. */
export function buildWhatsAppOrderMessage(req: OrderRequest, businessName = "Mami I Pâtisserie"): string {
  const { count, total } = cartTotals(req.cart);
  const campaigns = [...new Set(req.cart.map((c) => c.campaignName).filter(Boolean))];
  const lines = [
    `Halo ${businessName}, saya mau pesan:`,
    "",
    ...req.cart.map(
      (c) => `• ${c.qty}x ${c.name}${c.campaignName ? ` (${c.campaignName})` : ""} — ${formatRupiah(c.qty * c.unitPrice)}`,
    ),
    "",
    `Total (${count} item): *${formatRupiah(total)}*`,
  ];
  if (campaigns.length) lines.push(`Campaign: ${campaigns.join(", ")}`);
  lines.push(
    `Tanggal diinginkan: ${req.date ? formatDateId(req.date) : "fleksibel"}`,
    `Pengambilan: ${req.delivery === "ambil" ? "Ambil sendiri" : "Dikirim"}`,
  );
  if (req.name.trim()) lines.push(`Nama: ${req.name.trim()}`);
  if (req.notes.trim()) lines.push(`Catatan: ${req.notes.trim()}`);
  lines.push("", "Mohon konfirmasi harga final, ongkir, dan ketersediaannya ya. Terima kasih!");
  return lines.join("\n");
}

/** wa.me link; returns null when no WhatsApp number is configured. */
export function whatsAppUrl(number: string | undefined, text: string): string | null {
  const digits = (number ?? "").replace(/\D/g, "").replace(/^0/, "62");
  if (!/^62\d{7,13}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
