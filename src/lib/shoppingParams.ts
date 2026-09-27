import { addDays, isIsoDate } from "./preorder";

type SP = Record<string, string | string[] | undefined>;

export interface ShoppingParams {
  from: string;
  to: string;
  roundBatches: boolean;
  onlyPaidDp: boolean;
}

/** Max days in one shopping list. */
export const MAX_SHOPPING_DAYS = 62;

/** Shopping list options from URL params (shared by the page and the CSV export). Default: next 7 days. */
export function parseShoppingParams(sp: SP, today: string): ShoppingParams {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : sp[k]) ?? "";
  const from = isIsoDate(get("dari")) ? get("dari") : today;
  let to = isIsoDate(get("sampai")) ? get("sampai") : addDays(from, 6);
  if (to < from) to = from;
  if (to > addDays(from, MAX_SHOPPING_DAYS - 1)) to = addDays(from, MAX_SHOPPING_DAYS - 1);
  return { from, to, roundBatches: get("bulat") === "1", onlyPaidDp: get("dp") === "1" };
}

export function shoppingQuery(p: ShoppingParams): string {
  const s = new URLSearchParams({ dari: p.from, sampai: p.to });
  if (p.roundBatches) s.set("bulat", "1");
  if (p.onlyPaidDp) s.set("dp", "1");
  return s.toString();
}
