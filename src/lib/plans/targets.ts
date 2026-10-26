// Target & Rencana numbers (stage 5c). Pre-order sales count by fulfil date, cancelled orders excluded, shipping and
// order discounts left out (product sales only). Cafe revenue (Majoo) joins in stage 5f; until then it is null.
import type { Order } from "../preorder/types";

export interface MonthTargets {
  cafe: number | null;
  preorder: number | null;
  hampers: number | null;
  web: number | null;
  orders: number | null;
  avgOrder: number | null;
  /** Max food cost %. */
  foodCost: number | null;
}

export const EMPTY_TARGETS: MonthTargets = { cafe: null, preorder: null, hampers: null, web: null, orders: null, avgOrder: null, foodCost: null };

export interface MonthTargetRow extends MonthTargets {
  /** First day of the month, YYYY-MM-01. */
  month: string;
}

export interface YearTargetRow {
  year: number;
  revenue: number | null;
  orders: number | null;
}

/** "YYYY-MM" → "YYYY-MM-01". */
export const monthStart = (ym: string) => `${ym.slice(0, 7)}-01`;

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Targets for a month: its own row, else the latest earlier row ("ikut target bulan sebelumnya").
 * `from` is the month the values come from (null = no target set yet).
 */
export function monthTarget(rows: MonthTargetRow[], ym: string): { values: MonthTargets; own: boolean; from: string | null } {
  const key = monthStart(ym);
  const row = rows.filter((r) => r.month <= key).sort((a, b) => b.month.localeCompare(a.month))[0];
  if (!row) return { values: EMPTY_TARGETS, own: false, from: null };
  const { month, ...values } = row;
  return { values, own: month === key, from: month.slice(0, 7) };
}

/** Total revenue target of a month: cafe + pre-order + hampers (null when none of them is set). */
export function monthRevenueTarget(t: MonthTargets): number | null {
  const parts = [t.cafe, t.preorder, t.hampers].filter((v): v is number => v != null);
  return parts.length ? parts.reduce((s, v) => s + v, 0) : null;
}

/** Yearly target: Alto's own numbers, else the sum of the 12 monthly targets (`auto`). */
export function yearTarget(rows: MonthTargetRow[], years: YearTargetRow[], year: number) {
  let revenue = 0;
  let orders = 0;
  let anyRevenue = false;
  let anyOrders = false;
  for (let m = 1; m <= 12; m++) {
    const t = monthTarget(rows, `${year}-${String(m).padStart(2, "0")}`).values;
    const r = monthRevenueTarget(t);
    if (r != null) { revenue += r; anyRevenue = true; }
    if (t.orders != null) { orders += t.orders; anyOrders = true; }
  }
  const sum = { revenue: anyRevenue ? revenue : null, orders: anyOrders ? orders : null };
  const own = years.find((y) => y.year === year);
  return {
    revenue: own?.revenue ?? sum.revenue,
    orders: own?.orders ?? sum.orders,
    auto: !own,
    /** Sum of the monthly targets, to warn when Alto's yearly number differs. */
    sum,
  };
}

export interface Actuals {
  /** Majoo cafe revenue; null until cafe reports exist (stage 5f). */
  cafe: number | null;
  preorder: number;
  hampers: number;
  web: number;
  orders: number;
  avgOrder: number;
  /** HPP / product sales × 100; null without sales. */
  foodCost: number | null;
  /** Items without a stored HPP that used the current HPP. */
  estimatedItems: number;
}

/**
 * Sales in a date range split into pre-order (pastry & frozen) and hampers. Web sales are part of both.
 * HPP per item: the snapshot on the order item, else the current HPP.
 */
export function actuals(
  orders: Order[],
  from: string,
  to: string,
  isHampers: (productId: string) => boolean,
  currentCost: Map<string, number | null>,
  cafe: number | null = null,
): Actuals {
  let preorder = 0, hampers = 0, web = 0, hpp = 0, count = 0, estimatedItems = 0;
  for (const o of orders) {
    if (o.status === "batal" || o.fulfillDate < from || o.fulfillDate > to) continue;
    count++;
    for (const i of o.items) {
      const line = i.qty * i.unitPrice;
      if (isHampers(i.productId)) hampers += line;
      else preorder += line;
      if (o.channel === "web") web += line;
      if (i.unitCost != null) hpp += i.qty * i.unitCost;
      else {
        hpp += i.qty * (currentCost.get(i.productId) ?? 0);
        estimatedItems++;
      }
    }
  }
  const sales = preorder + hampers;
  return {
    cafe, preorder, hampers, web, orders: count,
    avgOrder: count ? Math.round(sales / count) : 0,
    foodCost: sales ? (hpp / sales) * 100 : null,
    estimatedItems,
  };
}

export interface Progress {
  /** value / target × 100, rounded; null without a target. */
  pct: number | null;
  /** Linear projection to the end of the period; null when not projected. */
  projection: number | null;
  /** On track: projection (or value) ≥ target, or for "lower is better" value ≤ target. Null without a target. */
  ok: boolean | null;
  /** Bar width 0–100. */
  bar: number;
}

/**
 * Progress against a target. `elapsed`/`total` are days into the period; while the period runs, the verdict uses
 * the straight-line projection (prototype). `lowerIsBetter` is for food cost.
 */
export function progress(
  value: number | null,
  target: number | null,
  opts: { elapsed?: number; total?: number; lowerIsBetter?: boolean; project?: boolean } = {},
): Progress {
  if (value == null || target == null || target <= 0) return { pct: null, projection: null, ok: null, bar: 0 };
  const pct = Math.round((value / target) * 100);
  if (opts.lowerIsBetter) return { pct, projection: null, ok: value <= target, bar: Math.min(100, (value / target) * 100) };
  const running = opts.project !== false && opts.elapsed != null && opts.total != null && opts.elapsed > 0 && opts.elapsed < opts.total;
  const projection = running ? Math.round((value / opts.elapsed!) * opts.total!) : null;
  return { pct, projection, ok: (projection ?? value) >= target, bar: Math.min(100, pct) };
}

/** Days of the period that have started: the whole month when past, 0 when future, else today's day number. */
export function elapsedDays(ym: string, today: string): number {
  const cur = today.slice(0, 7);
  if (ym < cur) return daysInMonth(ym);
  if (ym > cur) return 0;
  return Number(today.slice(8, 10));
}
