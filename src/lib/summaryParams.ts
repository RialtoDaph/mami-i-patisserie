import type { RoundingStep, SummaryOptions } from "./costing";

export type SummaryFilter = "semua" | "mamis" | "pastry_supplier" | "minuman" | "paket";

export interface SummaryParams extends SummaryOptions {
  filter: SummaryFilter;
}

const FILTERS: SummaryFilter[] = ["semua", "mamis", "pastry_supplier", "minuman", "paket"];

/** Reads summary options from URL search params (shared by the page and the CSV export). */
export function parseSummaryParams(sp: Record<string, string | string[] | undefined>): SummaryParams {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]);
  const step: RoundingStep = get("bulat") === "500" ? 500 : 1000;
  const filter = FILTERS.includes(get("kat") as SummaryFilter) ? (get("kat") as SummaryFilter) : "semua";
  return { roundingStep: step, includePbjt: get("pbjt") === "1", filter };
}

export function summaryQuery(p: SummaryParams, override: Partial<SummaryParams> = {}): string {
  const q = { ...p, ...override };
  const s = new URLSearchParams();
  if (q.includePbjt) s.set("pbjt", "1");
  if (q.roundingStep === 500) s.set("bulat", "500");
  if (q.filter !== "semua") s.set("kat", q.filter);
  const str = s.toString();
  return str ? `?${str}` : "";
}
