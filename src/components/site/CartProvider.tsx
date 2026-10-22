"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { productById } from "@/content/catalog";
import { addItem, cartCount, parseCart, setQty, type CartItem } from "@/lib/site/cart";

const STORAGE_KEY = "mami-cart-v2";
const TOAST_MS = 2600;

interface CartContextValue {
  items: CartItem[];
  count: number;
  /** False until the cart has been read from localStorage (avoids hydration mismatch). */
  ready: boolean;
  /** `origin` = the click that added the item (used by the fly-to-cart animation). */
  add: (productId: string, opts?: { qty?: number; note?: string; origin?: { x: number; y: number } }) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  toast: string;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    try {
      // Reading browser storage has to happen after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(parseCart(window.localStorage.getItem(STORAGE_KEY), (id) => Boolean(productById(id))));
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

  // Escape closes the drawers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const add = useCallback<CartContextValue["add"]>((productId, opts = {}) => {
    setItems((c) => addItem(c, productId, opts.qty ?? 1, opts.note ?? ""));
    const name = productById(productId)?.name ?? "Produk";
    setToast(`${name} ditambahkan`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
    if (opts.origin) window.dispatchEvent(new CustomEvent("mami:cart-add", { detail: opts.origin }));
  }, []);
  const update = useCallback((key: string, qty: number) => setItems((c) => setQty(c, key, qty)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, count: cartCount(items), ready, add, setQty: update, clear, toast, cartOpen, setCartOpen, menuOpen, setMenuOpen }),
    [items, ready, add, update, clear, toast, cartOpen, menuOpen],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
