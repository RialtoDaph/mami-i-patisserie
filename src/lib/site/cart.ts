// Shopping cart for the public website. Pure functions; persistence lives in the CartProvider.

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  /** Set when added from a campaign page (campaign price applies). */
  campaignId: string | null;
  campaignName: string | null;
  minLeadDays: number;
}

export type CartLine = CartItem;

/** A line is unique per product + campaign (same product may have a campaign price). */
export const lineKey = (i: Pick<CartItem, "productId" | "campaignId">) => `${i.productId}:${i.campaignId ?? ""}`;

export function addItem(cart: CartItem[], item: Omit<CartItem, "qty">, qty = 1): CartItem[] {
  const key = lineKey(item);
  const existing = cart.find((c) => lineKey(c) === key);
  if (existing) return cart.map((c) => (lineKey(c) === key ? { ...c, qty: c.qty + qty } : c));
  return [...cart, { ...item, qty }];
}

export function setQty(cart: CartItem[], key: string, qty: number): CartItem[] {
  if (qty <= 0) return cart.filter((c) => lineKey(c) !== key);
  return cart.map((c) => (lineKey(c) === key ? { ...c, qty: Math.floor(qty) } : c));
}

export function cartTotals(cart: CartItem[]): { count: number; total: number } {
  return {
    count: cart.reduce((s, c) => s + c.qty, 0),
    total: cart.reduce((s, c) => s + c.qty * c.unitPrice, 0),
  };
}

/** Parses stored JSON defensively (localStorage may hold anything). */
export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (c) =>
          c && typeof c.productId === "string" && typeof c.name === "string" &&
          Number.isFinite(c.unitPrice) && Number.isInteger(c.qty) && c.qty > 0,
      )
      .map((c) => ({
        productId: c.productId,
        name: c.name,
        unitPrice: c.unitPrice,
        qty: c.qty,
        campaignId: typeof c.campaignId === "string" ? c.campaignId : null,
        campaignName: typeof c.campaignName === "string" ? c.campaignName : null,
        minLeadDays: Number.isInteger(c.minLeadDays) ? c.minLeadDays : 0,
      }));
  } catch {
    return [];
  }
}
