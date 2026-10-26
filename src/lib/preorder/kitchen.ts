// Kitchen helpers for stage 5b: manual stock vs minimum, waste labels, and which status steps a role may take.
import type { OrderStatus } from "./types";

export type WasteReason = "tidak_laku" | "gagal" | "rusak" | "kadaluarsa" | "lain";

export const WASTE_REASON_LABEL: Record<WasteReason, string> = {
  tidak_laku: "Tidak laku",
  gagal: "Gagal produksi",
  rusak: "Rusak / jatuh",
  kadaluarsa: "Kedaluwarsa",
  lain: "Lainnya",
};

export interface StockLike {
  id: string;
  name: string;
  stockQty: number | null;
  minStock: number | null;
}

/**
 * Unit the kitchen counts in (stock and ingredient waste): kg / liter / pcs, whatever the purchase pack is.
 * factor = base units per counting unit.
 */
export function countUnit(baseUnit: "g" | "ml" | "pcs"): { factor: number; label: string } {
  return baseUnit === "g" ? { factor: 1000, label: "kg" } : baseUnit === "ml" ? { factor: 1000, label: "liter" } : { factor: 1, label: "pcs" };
}

export type StockState = "kurang" | "belum_dihitung" | "cukup" | "tanpa_minimum";

/** Below minimum, never counted (with a minimum set), fine, or no minimum set. */
export function stockState(i: Pick<StockLike, "stockQty" | "minStock">): StockState {
  if (i.minStock == null) return "tanpa_minimum";
  if (i.stockQty == null) return "belum_dihitung";
  return i.stockQty < i.minStock ? "kurang" : "cukup";
}

/** Ingredients that need attention on Beranda: under minimum first, then never counted. A–Z within each. */
export function lowStock<T extends StockLike>(items: T[]): (T & { state: "kurang" | "belum_dihitung" })[] {
  const rank = { kurang: 0, belum_dihitung: 1 } as const;
  return items
    .map((i) => ({ ...i, state: stockState(i) }))
    .filter((i): i is T & { state: "kurang" | "belum_dihitung" } => i.state === "kurang" || i.state === "belum_dihitung")
    .sort((a, b) => rank[a.state] - rank[b.state] || a.name.localeCompare(b.name));
}

/** The pastry chef (produksi) may only move an order to diproduksi or siap. Mirrors orders_status_guard in SQL. */
export const PRODUKSI_STATUSES: OrderStatus[] = ["diproduksi", "siap"];

export function canSetStatus(role: string | null, to: OrderStatus): boolean {
  if (role === "owner" || role === "admin") return true;
  if (role === "produksi") return PRODUKSI_STATUSES.includes(to);
  return false;
}
