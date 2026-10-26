"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Awning, Icon, IconButton, Logo, MiniAwning } from "@/components/brand";
import { useCart } from "./CartProvider";
import { NATAL_TAKEOVER, navFor } from "./nav";
import { useScrolled } from "./useScrolled";

const CHAIN = "repeating-linear-gradient(180deg, var(--color-brand-espresso) 0 5px, transparent 5px 7px)";

/**
 * "Gantung" header: canopy across the top with a name board hanging from it on two chains.
 * After 140px of scrolling a compact fixed bar slides in (logo, nav, cart) with a mini canopy dropping below it.
 * Phones (< 760px) get an espresso rod with the menu and cart buttons above the board.
 */
export function SiteHeader({ modeNatal }: { modeNatal: boolean }) {
  const path = usePathname();
  const scrolled = useScrolled(140);
  const { count, ready, setCartOpen, setMenuOpen } = useCart();
  const nav = navFor(modeNatal);
  const shown = ready ? count : 0;

  // The strip behind the canopy matches the first section of the page.
  const gapBg = modeNatal && NATAL_TAKEOVER.includes(path) ? "bg-brand-natal" : path === "/hampers" ? "bg-brand-wine" : "bg-brand-butter";

  return (
    <>
      <header
        inert={!scrolled}
        className={`px-page fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-t-4 border-brand-espresso bg-brand-butter-50 transition-[transform,opacity] duration-300 ${
          scrolled ? "translate-y-0 opacity-100" : "-translate-y-[110%] opacity-0"
        }`}
      >
        <Link href="/" aria-label="Mami I Patisserie, Beranda" className="flex items-center gap-3 whitespace-nowrap text-brand-espresso transition-opacity hover:opacity-80">
          <span className="font-display text-2xl leading-none italic">
            Mami <b className="text-brand-wine not-italic">I</b>
          </span>
          <span className="h-[18px] w-px bg-brand-espresso/40" />
          <span className="text-[10px] font-semibold tracking-[.45em]">PATISSERIE</span>
        </Link>
        <nav aria-label="Navigasi" className="flex items-center gap-4 wide:gap-6">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hidden text-sm font-semibold text-brand-espresso transition-opacity hover:opacity-70 nav:inline">
              {n.label}
            </Link>
          ))}
          <button
            type="button"
            data-cart-target
            onClick={() => setCartOpen(true)}
            aria-label="Buka keranjang"
            className="flex items-center gap-1.5 rounded-full bg-brand-espresso px-4 py-2 text-[13px] font-bold text-brand-butter transition-opacity hover:opacity-70 active:scale-[.97]"
          >
            <Icon name="shopping_bag" size={18} />
            <span className="tabular-nums">{shown}</span>
          </button>
          <IconButton icon="menu" label="Buka menu" className="nav:hidden" onClick={() => setMenuOpen(true)} />
        </nav>
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-full h-12 overflow-hidden">
          <span
            className="flex flex-col drop-shadow-[0_5px_4px_rgb(42_26_23/.28)]"
            style={{
              transform: scrolled ? "translateY(0)" : "translateY(-102%)",
              transition: `transform .7s cubic-bezier(.3,1.3,.45,1) ${scrolled ? ".22s" : "0s"}`,
            }}
          >
            <MiniAwning stripe={22} fringe={16} />
          </span>
        </span>
      </header>

      {/* flow-root: the canopy's negative top margin must not drag this whole block (and the sign) upwards. */}
      <div className="relative flow-root">
      <div className="px-page relative z-[4] flex h-14 items-center justify-between bg-brand-espresso nav:hidden">
        <IconButton icon="menu" label="Buka menu" tone="outline-light" onClick={() => setMenuOpen(true)} />
        <IconButton icon="shopping_bag" label="Buka keranjang" tone="wine" badge={shown} data-cart-target onClick={() => setCartOpen(true)} />
      </div>

      {/* Absolutely placed (not an empty in-flow box) so the canopy's negative margin cannot collapse through it. */}
      <div className="absolute inset-x-0 top-14 z-[5] h-0 nav:top-0">
        <div className="absolute top-0 left-1/2 flex w-max -translate-x-1/2 animate-sign-swing flex-col items-center whitespace-nowrap origin-top">
          <div className="flex h-[70px] w-[clamp(110px,18vw,150px)] justify-between nav:h-[66px]">
            <span className="w-[3px]" style={{ background: CHAIN }} />
            <span className="w-[3px]" style={{ background: CHAIN }} />
          </div>
          <div className="rounded-md bg-brand-espresso px-[clamp(24px,3.2vw,34px)] py-[clamp(12px,1.6vw,16px)] shadow-[inset_0_0_0_5px_var(--color-brand-espresso),inset_0_0_0_6.5px_rgb(245_232_170/.55),0_16px_28px_rgb(42_26_23/.35)]">
            <Link href="/" aria-label="Mami I Patisserie, Beranda">
              <Logo />
            </Link>
          </div>
        </div>
      </div>

      <div className={`relative z-[3] -mb-4 nav:-mt-[34px] ${gapBg}`}>
        <Awning slope animate />
      </div>
      <div className={`h-[60px] nav:h-[72px] ${gapBg}`} />
      </div>
    </>
  );
}
