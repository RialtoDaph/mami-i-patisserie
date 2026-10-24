import { LocalTabs } from "@/components/app/ui";

export type ProductionTab = "jadwal" | "belanja" | "stok" | "waste";

export function ProductionTabs({ active }: { active: ProductionTab }) {
  return (
    <LocalTabs
      items={[
        { href: "/app/produksi", label: "Jadwal", icon: "calendar_month", active: active === "jadwal" },
        { href: "/app/produksi/belanja", label: "Belanja", icon: "shopping_basket", active: active === "belanja" },
        { href: "/app/produksi/stok", label: "Stok", icon: "inventory_2", active: active === "stok" },
        { href: "/app/produksi/waste", label: "Waste", icon: "delete_sweep", active: active === "waste" },
      ]}
    />
  );
}
