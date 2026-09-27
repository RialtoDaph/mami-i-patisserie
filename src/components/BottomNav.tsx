"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "Beranda", icon: "🏠", match: [] as string[] },
  { href: "/app/order", label: "Order", icon: "🧾", match: ["/app/order"] },
  { href: "/app/produksi", label: "Produksi", icon: "👩‍🍳", match: ["/app/produksi"] },
  { href: "/app/costing", label: "Costing", icon: "📊", match: ["/app/costing", "/app/bahan", "/app/resep", "/app/paket"] },
  {
    href: "/app/lainnya",
    label: "Lainnya",
    icon: "☰",
    match: ["/app/lainnya", "/app/produk", "/app/campaign", "/app/pelanggan", "/app/pengaturan"],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {TABS.map((t) => {
          const active = t.href === "/app" ? pathname === "/app" : t.match.some((m) => pathname.startsWith(m));
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                  active ? "text-cocoa" : "text-muted"
                }`}
              >
                <span aria-hidden className="text-xl leading-none">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
