"use client";

import { lineKey, type CartItem } from "@/lib/site/cart";
import { useCart } from "./CartProvider";

/** "+ Keranjang" that turns into a − qty + stepper once the product is in the cart. */
export function AddToCartButton({ item }: { item: Omit<CartItem, "qty"> }) {
  const cart = useCart();
  const key = lineKey(item);
  const qty = cart.items.find((i) => lineKey(i) === key)?.qty ?? 0;

  if (!cart.ready || qty === 0) {
    return (
      <button type="button" onClick={() => cart.add(item)} className="btn-wine min-h-11 w-full px-4 text-sm">
        + Keranjang
      </button>
    );
  }
  return (
    <div className="flex min-h-11 w-full items-center justify-between rounded-full border border-brand-espresso/40 bg-brand-cream">
      <button type="button" aria-label={`Kurangi ${item.name}`} onClick={() => cart.setQty(key, qty - 1)} className="size-11 text-xl font-bold text-brand-muted">−</button>
      <span className="font-semibold tabular-nums text-brand-espresso" aria-live="polite">{qty}</span>
      <button type="button" aria-label={`Tambah ${item.name}`} onClick={() => cart.setQty(key, qty + 1)} className="size-11 text-xl font-bold text-brand-muted">+</button>
    </div>
  );
}
