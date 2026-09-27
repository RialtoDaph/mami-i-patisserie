import type { OrderFilter, OrderStatus } from "./preorder";
import { ORDER_STATUSES } from "./preorder";

type SP = Record<string, string | string[] | undefined>;

/** Order list filters from URL params (shared by the page and the CSV export). */
export function parseOrderFilter(sp: SP): OrderFilter {
  const get = (k: string) => {
    const v = Array.isArray(sp[k]) ? sp[k]![0] : sp[k];
    return v && v.trim() ? v.trim() : null;
  };
  const status = get("status");
  const date = (s: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null);
  return {
    campaignId: get("kampanye"),
    status: status === "semua" ? null : status && ORDER_STATUSES.includes(status as OrderStatus) ? (status as OrderStatus) : "aktif",
    from: date(get("dari")),
    to: date(get("sampai")),
    q: get("q"),
  };
}

export function orderFilterQuery(f: OrderFilter): string {
  const s = new URLSearchParams();
  if (f.campaignId) s.set("kampanye", f.campaignId);
  if (f.status !== "aktif") s.set("status", f.status ?? "semua");
  if (f.from) s.set("dari", f.from);
  if (f.to) s.set("sampai", f.to);
  if (f.q) s.set("q", f.q);
  const str = s.toString();
  return str ? `?${str}` : "";
}
