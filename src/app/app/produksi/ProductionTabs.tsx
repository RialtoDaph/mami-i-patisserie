import Link from "next/link";

export function ProductionTabs({ active }: { active: "jadwal" | "belanja" }) {
  return (
    <nav className="mb-4 grid grid-cols-2 gap-2">
      <Link href="/app/produksi" className={active === "jadwal" ? "chip-on" : "chip-off"}>Jadwal</Link>
      <Link href="/app/produksi/belanja" className={active === "belanja" ? "chip-on" : "chip-off"}>Belanja</Link>
    </nav>
  );
}
