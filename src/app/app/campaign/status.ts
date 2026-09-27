import type { Campaign } from "@/lib/preorder";

export function campaignState(c: Campaign, today: string): { label: string; className: string } {
  if (!c.isActive) return { label: "Nonaktif", className: "bg-black/5 text-muted" };
  if (today < c.preorderOpen) return { label: "Belum buka", className: "bg-sky-100 text-sky-800" };
  if (today > c.preorderClose) return { label: "Tutup", className: "bg-black/5 text-muted" };
  return { label: "Buka", className: "bg-ok-bg text-ok" };
}
