"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import { useCart } from "./CartProvider";

/** Floating cart summary on phones, shown when the cart has items. */
export function CartBar() {
  const { count, total, ready } = useCart();
  const pathname = usePathname();
  if (!ready || count === 0 || pathname === "/keranjang") return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link href="/keranjang" className="btn-wine w-full justify-between px-5 shadow-xl">
        <span>🛒 {count} item · {formatRupiah(total)}</span>
        <span>Pesan →</span>
      </Link>
    </div>
  );
}

export function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/keranjang" className="relative flex size-11 items-center justify-center rounded-full text-xl text-brand-muted hover:bg-brand-butter-soft" aria-label={`Keranjang (${ready ? count : 0} item)`}>
      🛒
      {ready && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-wine px-1 text-[11px] font-bold text-brand-butter">
          {count}
        </span>
      )}
    </Link>
  );
}
