"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Icon, StripeDivider } from "@/components/brand";
import { instagramUrl, site } from "@/content/site";
import { formatRupiah } from "@/lib/format";
import { lineKey } from "@/lib/site/cart";
import { WA_ASK, waLink } from "@/lib/site/wa";
import { useCart } from "./CartProvider";
import { navFor } from "./nav";

/** Mobile menu drawer, cart drawer, sticky mobile cart bar and the "ditambahkan" toast. */
export function SiteOverlays({ modeNatal }: { modeNatal: boolean }) {
  const path = usePathname();
  const { count, ready, cartOpen, menuOpen, setCartOpen, setMenuOpen, toast } = useCart();
  const showBar = ready && count > 0 && !cartOpen && !menuOpen && path !== "/keranjang";

  // Close drawers on navigation; lock page scroll while one is open.
  useEffect(() => {
    setCartOpen(false);
    setMenuOpen(false);
  }, [path, setCartOpen, setMenuOpen]);
  useEffect(() => {
    if (!cartOpen && !menuOpen) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [cartOpen, menuOpen]);

  return (
    <>
      {menuOpen && <MenuDrawer modeNatal={modeNatal} onClose={() => setMenuOpen(false)} />}
      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      {showBar && (
        <>
          <div className="h-[84px] nav:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-[90] border-t-[1.5px] border-brand-espresso/12 bg-brand-butter-50/95 px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(62_39_35/.1)] backdrop-blur-md nav:hidden">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Buka keranjang"
              data-cart-target
              className="flex min-h-14 w-full items-center gap-3 rounded-full bg-brand-wine py-0 pr-2 pl-[22px] text-base font-bold text-brand-butter"
            >
              <Icon name="shopping_bag" size={22} />
              <span className="flex-1 text-left">{count} item di keranjang</span>
              <span className="flex min-h-[42px] items-center gap-1.5 rounded-full bg-brand-butter px-4 text-[15px] text-brand-wine">
                Pesan <Icon name="arrow_forward" size={18} />
              </span>
            </button>
          </div>
        </>
      )}
      {toast && (
        <div
          role="status"
          className="fixed left-1/2 z-[120] flex max-w-[calc(100vw-24px)] -translate-x-1/2 animate-fade-up items-center gap-3.5 rounded-full bg-brand-espresso py-3 pr-3 pl-5 text-[15px] text-brand-butter shadow-[0_14px_34px_rgb(62_39_35/.35)]"
          style={{ bottom: showBar ? 96 : 32 }}
        >
          <Icon name="check_circle" size={22} className="text-brand-pistachio" />
          <span className="min-w-0">{toast}</span>
          <button type="button" onClick={() => setCartOpen(true)} className="min-h-10 shrink-0 rounded-full bg-brand-butter px-4 text-sm font-bold text-brand-espresso">
            Lihat keranjang
          </button>
        </div>
      )}
    </>
  );
}

function MenuDrawer({ modeNatal, onClose }: { modeNatal: boolean; onClose: () => void }) {
  const wa = waLink(WA_ASK);
  return (
    <div className="fixed inset-0 z-[110] flex bg-brand-espresso/45" onClick={onClose}>
      <nav aria-label="Menu" onClick={(e) => e.stopPropagation()} className="flex h-full w-[min(340px,86%)] flex-col bg-brand-espresso text-brand-butter shadow-[20px_0_50px_rgb(62_39_35/.3)]">
        <div className="flex items-center justify-between py-5 pr-5 pl-6">
          <span className="font-display text-[28px] leading-none italic">
            Mami <span className="font-bold text-brand-wine not-italic">I</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Tutup menu" className="flex size-11 items-center justify-center rounded-full">
            <Icon name="close" size={24} />
          </button>
        </div>
        <StripeDivider height={8} stripe={16} />
        <div className="flex flex-1 flex-col overflow-auto py-3">
          {navFor(modeNatal).map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              className="flex min-h-[60px] items-center justify-between border-b border-brand-butter/12 px-6 font-display text-[22px] font-bold text-brand-butter hover:bg-brand-butter/6"
            >
              {n.label}
              <Icon name="arrow_forward" size={20} className="text-brand-pistachio" />
            </Link>
          ))}
        </div>
        {wa && (
          <div className="px-6 pt-5 pb-7">
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex min-h-[54px] items-center justify-center gap-2.5 rounded-full bg-brand-wine font-bold text-brand-butter">
              <Icon name="chat" size={22} /> Chat WhatsApp
            </a>
          </div>
        )}
      </nav>
    </div>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, count, setQty, product } = useCart();
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-brand-espresso/45" onClick={onClose}>
      <aside role="dialog" aria-label="Keranjang" onClick={(e) => e.stopPropagation()} className="flex h-full w-[420px] max-w-full flex-col bg-brand-butter-50 text-brand-espresso shadow-[-20px_0_50px_rgb(62_39_35/.25)]">
        <div className="flex items-center justify-between bg-brand-espresso px-6 py-5 text-brand-butter">
          <span className="font-display text-2xl font-bold">Keranjang</span>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex size-11 items-center justify-center rounded-full hover:bg-brand-butter/12">
            <Icon name="close" size={24} />
          </button>
        </div>
        <StripeDivider height={8} stripe={16} />
        <div className="flex flex-1 flex-col gap-3.5 overflow-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <Icon name="shopping_bag" size={48} className="text-brand-pistachio" />
              <span className="font-script text-[26px] text-brand-wine">keranjang masih kosong</span>
              <span className="text-[15px] text-brand-muted">Pilih pastry atau hampers favorit dulu, ya.</span>
            </div>
          ) : (
            items.map((c) => {
              const p = product(c.productId);
              if (!p) return null;
              const key = lineKey(c);
              return (
                <div key={key} className="grid grid-cols-[72px_1fr] items-center gap-3.5 bg-white p-3 shadow-[0_1px_0_rgb(62_39_35/.08),0_6px_16px_rgb(62_39_35/.06)]">
                  <div className="photo-slot size-[72px]" />
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-display text-base leading-tight font-bold">{p.name}</span>
                      <button type="button" onClick={() => setQty(key, 0)} aria-label="Hapus" className="flex size-8 shrink-0 items-center justify-center rounded-full text-brand-muted hover:bg-brand-butter-100">
                        <Icon name="delete" size={20} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <QtyStepper qty={c.qty} onChange={(q) => setQty(key, q)} size="sm" />
                      <span className="font-script text-[17px] text-brand-muted">{p.showPrice ? formatRupiah(p.price * c.qty) : "harga menyusul"}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {items.length > 0 && (
          <div className="flex flex-col gap-3 border-t-[1.5px] border-dashed border-brand-espresso/30 bg-brand-butter-100 px-6 pt-[18px] pb-6">
            <p className="flex gap-2 text-sm leading-normal text-brand-muted">
              <Icon name="info" size={18} />
              <span>Ongkir dihitung di checkout. DP untuk mengunci pesananmu.</span>
            </p>
            <Link
              href="/keranjang"
              onClick={onClose}
              className="flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-brand-wine font-bold text-brand-butter transition hover:brightness-[.92] active:scale-[.97]"
            >
              <Icon name="arrow_forward" size={22} /> Lanjut ke checkout · {count} item
            </Link>
            <button type="button" onClick={onClose} className="min-h-12 text-[15px] font-bold text-brand-espresso underline underline-offset-4">
              Lanjut belanja
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

/** − qty + stepper (pill outline). */
export function QtyStepper({ qty, onChange, size = "md", min = 0 }: { qty: number; onChange: (qty: number) => void; size?: "sm" | "md"; min?: number }) {
  const btn = size === "sm" ? "size-10" : "size-11";
  return (
    <div className="flex items-center rounded-full border-[1.5px] border-brand-espresso/25 bg-white">
      <button type="button" onClick={() => onChange(Math.max(min, qty - 1))} aria-label="Kurangi" className={`flex items-center justify-center ${btn}`}>
        <Icon name="remove" size={20} />
      </button>
      <span className="min-w-7 text-center font-bold tabular-nums">{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label="Tambah" className={`flex items-center justify-center ${btn}`}>
        <Icon name="add" size={20} />
      </button>
    </div>
  );
}

export function SiteFooter({ modeNatal }: { modeNatal: boolean }) {
  const wa = waLink(WA_ASK);
  return (
    <>
      <StripeDivider height={10} />
      <footer className="px-page flex flex-col items-center gap-10 bg-brand-espresso pt-[clamp(52px,9vw,72px)] pb-7 text-brand-butter">
        <Link href="/" aria-label="Mami I Patisserie, Beranda" className="transition-opacity hover:opacity-80">
          <span className="flex flex-col items-center gap-3.5 leading-none">
            <span className="font-display text-[clamp(48px,12vw,72px)] italic">
              Mami <span className="font-bold not-italic">I</span>
            </span>
            <span className="flex items-center gap-4 text-sm font-semibold tracking-[.6em]">
              <span className="h-px w-10 bg-brand-butter" />
              <span className="-mr-[.6em]">PATISSERIE</span>
              <span className="h-px w-10 bg-brand-butter" />
            </span>
          </span>
        </Link>
        <nav aria-label="Tautan bawah" className="flex flex-wrap justify-center gap-x-7 gap-y-3.5 text-[15px] font-semibold">
          {navFor(modeNatal).map((n) => (
            <Link key={n.href} href={n.href} className="text-brand-butter transition-opacity hover:opacity-70">
              {n.label}
            </Link>
          ))}
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="text-brand-butter hover:opacity-70">
              WhatsApp
            </a>
          )}
          <InstagramLink className="text-brand-butter hover:opacity-70">Instagram</InstagramLink>
        </nav>
        <div className="flex w-full justify-between gap-4 border-t border-brand-butter/15 pt-[18px] text-[13px] text-brand-butter-100">
          <span>© {new Date().getFullYear()} Mami I Patisserie · Bandung</span>
          <Link href="/login" className="text-brand-butter-100 hover:underline">
            Masuk tim
          </Link>
        </div>
      </footer>
    </>
  );
}

/** Link to the Instagram profile; renders nothing until NEXT_PUBLIC_INSTAGRAM is set. */
export function InstagramLink({ className, children }: { className?: string; children: React.ReactNode }) {
  const href = instagramUrl(site.instagram);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

