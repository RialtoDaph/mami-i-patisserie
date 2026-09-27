import Link from "next/link";

const TABS = [
  { href: "/app/costing", label: "Ringkasan" },
  { href: "/app/bahan", label: "Bahan" },
  { href: "/app/resep", label: "Resep" },
  { href: "/app/paket", label: "Paket" },
];

/** Sub-navigation inside the Costing tab. */
export function CostingTabs({ active }: { active: string }) {
  return (
    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={active === t.href ? "chip-on" : "chip-off"}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
