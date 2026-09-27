// Test fixtures for the preorder module (mirrors the DUMMY seed).
import type { Campaign, Customer, Order, Product, Settings } from "./types";

export const products: Product[] = [
  { id: "risolFrozen", name: "Risol Frozen isi 10", description: null, recipeId: "risol", bundleId: null, unitsPerProduct: 10, price: 75000, showOnWebsite: true, preorderEnabled: true, weeklyCapacity: 40, minLeadDays: 2, photoPath: null, isActive: true },
  { id: "croissant", name: "Pistachio Croissant", description: null, recipeId: "pcroissant", bundleId: null, unitsPerProduct: 1, price: 58000, showOnWebsite: true, preorderEnabled: true, weeklyCapacity: 30, minLeadDays: 1, photoPath: null, isActive: true },
  { id: "box", name: "Blessings Box", description: null, recipeId: null, bundleId: "blessings", unitsPerProduct: 1, price: 250000, showOnWebsite: true, preorderEnabled: true, weeklyCapacity: 5, minLeadDays: 3, photoPath: null, isActive: true },
  { id: "unlimited", name: "Kue tanpa batas", description: null, recipeId: "risol", bundleId: null, unitsPerProduct: 1, price: 5000, showOnWebsite: false, preorderEnabled: true, weeklyCapacity: null, minLeadDays: 0, photoPath: null, isActive: true },
];

export const lebaran: Campaign = {
  id: "lebaran", name: "Lebaran 2027", preorderOpen: "2027-01-15", preorderClose: "2027-03-03",
  fulfillStart: "2027-02-20", fulfillEnd: "2027-03-08", dpPercent: 50, isActive: true,
  products: [{ productId: "risolFrozen", priceOverride: 70000 }, { productId: "box", priceOverride: null }],
};

export const settings: Settings = {
  businessName: "Mami I Pâtisserie", businessWhatsapp: "6281200000000", bankName: "BCA", bankAccountNo: "1234567890",
  bankAccountName: "Mami", qrisNote: null, pickupAddress: "Jl. Contoh 1, Bandung", defaultDpPercent: 50,
};

export const customers: Customer[] = [
  { id: "rina", name: "Bu Rina", whatsapp: "6281111111111", address: "Dago", notes: null },
  { id: "budi", name: "Pak Budi", whatsapp: "6282222222222", address: null, notes: null },
];

let n = 0;
export function order(p: Partial<Order> & Pick<Order, "fulfillDate" | "items">): Order {
  const subtotal = p.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const shippingFee = p.shippingFee ?? 0;
  const discount = p.discount ?? 0;
  n++;
  return {
    id: p.id ?? `o${n}`, orderNo: p.orderNo ?? `MIP-${String(n).padStart(4, "0")}`, customerId: p.customerId ?? "rina",
    campaignId: p.campaignId ?? null, fulfillMethod: p.fulfillMethod ?? "ambil", deliveryAddress: p.deliveryAddress ?? null,
    status: p.status ?? "baru", subtotal, shippingFee, discount, total: subtotal + shippingFee - discount,
    dpAmount: p.dpAmount ?? 0, amountPaid: p.amountPaid ?? 0, notes: null, createdAt: "2026-09-27T00:00:00Z", ...p,
  };
}
