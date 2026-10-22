// Shopping cart for the public website. Pure functions; persistence lives in the CartProvider.
// Prices are NOT stored in the cart: they are looked up from the catalog when shown, so a price change
// never leaves a stale amount in someone's browser.

export interface CartItem {
  productId: string;
  qty: number;
  /** Greeting card text for hampers ("Untuk …: pesan — dari"), "" if none. */
  note: string;
}

/** The same product with a different card message is a separate line. */
export const lineKey = (i: Pick<CartItem, "productId" | "note">) => `${i.productId}|${i.note}`;

export function addItem(cart: CartItem[], productId: string, qty = 1, note = ""): CartItem[] {
  const key = lineKey({ productId, note });
  if (cart.some((c) => lineKey(c) === key)) return cart.map((c) => (lineKey(c) === key ? { ...c, qty: c.qty + qty } : c));
  return [...cart, { productId, qty, note }];
}

export function setQty(cart: CartItem[], key: string, qty: number): CartItem[] {
  if (qty <= 0) return cart.filter((c) => lineKey(c) !== key);
  return cart.map((c) => (lineKey(c) === key ? { ...c, qty: Math.floor(qty) } : c));
}

export const cartCount = (cart: CartItem[]) => cart.reduce((s, c) => s + c.qty, 0);

/** Parses stored JSON defensively (localStorage may hold anything); drops unknown products. */
export function parseCart(raw: string | null, isKnown: (productId: string) => boolean): CartItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter((c) => c && typeof c.productId === "string" && isKnown(c.productId) && Number.isInteger(c.qty) && c.qty > 0)
      .map((c) => ({ productId: c.productId, qty: c.qty, note: typeof c.note === "string" ? c.note.slice(0, 300) : "" }));
  } catch {
    return [];
  }
}

/** Card text as stored on the line: "Untuk Tante Rina: Selamat Natal! — Dimas". */
export function cardNote({ to, msg, from }: { to: string; msg: string; from: string }): string {
  const t = to.trim(), m = msg.trim(), f = from.trim();
  if (!m && !t && !f) return "";
  return `${t ? `Untuk ${t}: ` : ""}${m}${f ? ` — ${f}` : ""}`;
}
