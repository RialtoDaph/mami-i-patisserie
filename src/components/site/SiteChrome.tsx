import Link from "next/link";
import { instagramUrl, site } from "@/content/site";
import { whatsAppUrl } from "@/lib/site/orderMessage";
import { CartLink } from "./CartBar";

const NAV = [
  { href: "/katalog", label: "Menu" },
  { href: "/hampers", label: "Hampers" },
  { href: "/kontak", label: "Kontak" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-brand-espresso/10 bg-brand-cream/95 backdrop-blur">
      <div className="awning h-1.5" aria-hidden />
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="font-display text-2xl font-semibold leading-none text-brand-espresso">
          Mami <span className="text-brand-wine">I</span> Pâtisserie
        </Link>
        <nav className="flex items-center gap-1">
          <ul className="flex items-center">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="flex min-h-11 items-center px-2 text-sm font-semibold text-brand-muted hover:text-brand-wine sm:px-3">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const wa = whatsAppUrl(site.whatsapp, `Halo ${site.name}, saya mau tanya.`);
  const ig = instagramUrl(site.instagram);
  return (
    <footer className="mt-16 bg-brand-espresso pb-24 text-brand-butter md:pb-0">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl font-semibold">{site.name}</p>
          <p className="mt-1 text-sm text-brand-butter/80">Kue & pastry rumahan · {site.city}</p>
          <p className="mt-3 text-sm text-brand-butter">{site.timeline}</p>
        </div>
        <ul className="flex flex-col gap-2 text-sm">
          <li><Link href="/katalog" className="hover:underline">Menu</Link></li>
          <li><Link href="/hampers" className="hover:underline">Hampers & Blessings Box</Link></li>
          <li><Link href="/kontak" className="hover:underline">Kontak & pengiriman</Link></li>
        </ul>
        <ul className="flex flex-col gap-2 text-sm">
          {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="hover:underline">WhatsApp</a></li>}
          {ig && <li><a href={ig} target="_blank" rel="noopener noreferrer" className="hover:underline">Instagram @{site.instagram}</a></li>}
        </ul>
      </div>
      <div className="border-t border-brand-butter/10">
        <div className="mx-auto flex max-w-5xl justify-between px-4 py-4 text-xs text-brand-butter/60">
          <span>© {new Date().getFullYear()} {site.name}</span>
          <Link href="/login" className="hover:underline">Masuk tim</Link>
        </div>
      </div>
    </footer>
  );
}
