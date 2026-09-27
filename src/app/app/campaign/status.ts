import type { Campaign } from "@/lib/preorder";

export function campaignState(c: Campaign, today: string): { label: string; className: string } {
  if (!c.isActive) return { label: "Nonaktif", className: "bg-brand-espresso/5 text-muted" };
  if (today < c.preorderOpen) return { label: "Belum buka", className: "bg-brand-butter text-brand-espresso" };
  if (today > c.preorderClose) return { label: "Tutup", className: "bg-brand-espresso/5 text-muted" };
  return { label: "Buka", className: "bg-brand-pistachio text-brand-espresso" };
}
