import { addDays, formatDateId, isIsoDate } from "./dates";
import { subtotalOf, totalOf } from "./payment";
import type { Campaign, FulfillMethod, Product } from "./types";

export interface OrderDraft {
  items: { productId: string; qty: number; unitPrice: number }[];
  fulfillDate: string;
  fulfillMethod: FulfillMethod;
  deliveryAddress: string;
  campaignId: string | null;
  shippingFee: number;
  discount: number;
  dpAmount: number;
}

/** Earliest allowed fulfill date given the products' lead times. */
export function earliestFulfillDate(productIds: string[], products: Product[], today: string): string {
  const lead = Math.max(0, ...productIds.map((id) => products.find((p) => p.id === id)?.minLeadDays ?? 0));
  return addDays(today, lead);
}

/**
 * Validation errors (Indonesian) for a draft order. Date rules (lead time, campaign
 * window) apply to new orders or when the date/campaign changed, like save_order().
 */
export function validateOrderDraft(
  draft: OrderDraft,
  ctx: { products: Product[]; campaign: Campaign | null; today: string; checkDates: boolean },
): string[] {
  const errors: string[] = [];
  const { products, campaign, today } = ctx;

  if (draft.items.length === 0) errors.push("Pilih minimal 1 produk.");
  for (const i of draft.items) {
    const p = products.find((x) => x.id === i.productId);
    if (!p) {
      errors.push("Ada produk yang belum dipilih.");
      continue;
    }
    if (!Number.isInteger(i.qty) || i.qty <= 0) errors.push(`Jumlah "${p.name}" harus bilangan bulat > 0.`);
    if (ctx.checkDates && (!p.isActive || !p.preorderEnabled)) errors.push(`"${p.name}" sedang tidak bisa dipreorder.`);
    if (campaign && ctx.checkDates && !campaign.products.some((cp) => cp.productId === p.id)) {
      errors.push(`"${p.name}" tidak termasuk campaign ${campaign.name}.`);
    }
  }

  if (!isIsoDate(draft.fulfillDate)) {
    errors.push("Pilih tanggal ambil/kirim.");
  } else if (ctx.checkDates) {
    const earliest = earliestFulfillDate(draft.items.map((i) => i.productId), products, today);
    if (draft.fulfillDate < earliest) errors.push(`Tanggal terlalu dekat. Paling cepat ${formatDateId(earliest)}.`);
    if (campaign) {
      if (today < campaign.preorderOpen || today > campaign.preorderClose) {
        errors.push(
          `Preorder ${campaign.name} hanya dibuka ${formatDateId(campaign.preorderOpen, false)} – ${formatDateId(campaign.preorderClose, false)}.`,
        );
      }
      if ((campaign.fulfillStart && draft.fulfillDate < campaign.fulfillStart) || (campaign.fulfillEnd && draft.fulfillDate > campaign.fulfillEnd)) {
        errors.push(
          `Tanggal ambil/kirim ${campaign.name} harus antara ${campaign.fulfillStart ? formatDateId(campaign.fulfillStart, false) : "–"} dan ${campaign.fulfillEnd ? formatDateId(campaign.fulfillEnd, false) : "–"}.`,
        );
      }
    }
  }

  if (draft.fulfillMethod !== "ambil" && !draft.deliveryAddress.trim()) errors.push("Alamat kirim wajib diisi.");
  if (draft.shippingFee < 0 || draft.discount < 0 || draft.dpAmount < 0) errors.push("Angka tidak boleh negatif.");

  const total = totalOf(subtotalOf(draft.items), draft.shippingFee, draft.discount);
  if (total < 0) errors.push("Diskon lebih besar dari subtotal + ongkir.");
  if (draft.dpAmount > Math.max(total, 0)) errors.push("DP tidak boleh lebih besar dari total.");
  return errors;
}
