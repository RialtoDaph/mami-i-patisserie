"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/app", label: "Ringkasan", icon: "📊" },
  { href: "/app/bahan", label: "Bahan", icon: "🧈" },
  { href: "/app/resep", label: "Resep", icon: "📖" },
  { href: "/app/paket", label: "Paket", icon: "🎁" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === "/app" ? pathname === "/app" : pathname.startsWith(t.href);
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
