"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addItem, cartTotals, parseCart, setQty, type CartItem } from "@/lib/site/cart";

const STORAGE_KEY = "mami-cart-v1";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  /** False until the cart has been read from localStorage (avoids hydration mismatch). */
  ready: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      // Reading browser storage has to happen after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(parseCart(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      // Storage unavailable (private mode): keep an in-memory cart.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota / private mode errors.
    }
  }, [items, ready]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => setItems((c) => addItem(c, item, qty)), []);
  const update = useCallback((key: string, qty: number) => setItems((c) => setQty(c, key, qty)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, ...cartTotals(items), ready, add, setQty: update, clear }), [items, ready, add, update, clear]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
