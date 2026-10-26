import Link from "next/link";
import type { CurrentUser, FullCostingData } from "@/lib/data";
import type { PreorderData } from "@/lib/preorderData";
import type { PlansData } from "@/lib/plansData";
import { can } from "@/lib/permissions";
import { campaignUsed, formatDateId, productCosts } from "@/lib/preorder";
import {
  actuals, daysInMonth, elapsedDays, monthRevenueTarget, monthTarget, progress, shiftMonth, yearTarget, type Progress,
} from "@/lib/plans";
import { formatNumber, formatRupiah } from "@/lib/format";
import { Icon } from "@/components/brand";
import { ChipLink, Panel, SectionLabel } from "@/components/app/ui";
import { MONTHS, MONTHS_SHORT, monthLabel, targetHref, type TargetParams } from "./params";
import { MonthTargetForm, ResetYearButton, YearTargetForm } from "./TargetForms";

const count = (n: number) => formatNumber(Math.round(n));
const pct = (n: number) => `${formatNumber(Math.round(n))}%`;

interface CardProps {
  label: string;
  src: string;
  value: number | null;
  target: number | null;
  prog: Progress;
  fmt?: (n: number) => string;
  lowerIsBetter?: boolean;
  missing?: string;
}

/** One metric: value, bar (olive on track, wine behind) and "x% dari target · proyeksi". */
function TargetCard({ label, src, value, target, prog, fmt = formatRupiah, lowerIsBetter, missing }: CardProps) {
  let sub: string;
  if (value == null) sub = missing ?? "Belum ada data";
  else if (target == null) sub = "Belum ada target";
  else if (lowerIsBetter) sub = `Target maks ${fmt(target)}${prog.ok ? " · aman" : ` · lewat ${fmt(value - target)}`}`;
  else sub = `${prog.pct}% dari ${fmt(target)}${prog.projection != null ? ` · proyeksi ${fmt(prog.projection)}` : ""}`;
  const tone = prog.ok == null ? "text-brand-muted" : prog.ok ? "text-brand-olive" : "text-brand-wine";
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-4 py-3.5">
      <span className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-bold">{label}</span>
        <span className="text-right text-[11px] leading-tight text-brand-muted">{src}</span>
      </span>
      <span className="font-display text-[24px] leading-tight font-bold tabular-nums">{value == null ? "–" : fmt(value)}</span>
      <span className="h-2 overflow-hidden rounded-full bg-brand-espresso/10">
        <span className={`block h-full rounded-full ${prog.ok === false ? "bg-brand-wine" : "bg-brand-olive"}`} style={{ width: `${prog.bar}%` }} />
      </span>
      <span className={`text-[13px] leading-snug ${tone}`}>{sub}</span>
    </div>
  );
}

export function TargetNumbers({
  params, today, user, plans, pre, costing,
}: {
  params: TargetParams;
  today: string;
  user: CurrentUser;
  plans: PlansData;
  pre: PreorderData;
  costing: FullCostingData;
}) {
  const isAlto = can(user.role, "plans.manage");
  const hampers = new Set(pre.products.filter((p) => p.webCategory === "hampers").map((p) => p.id));
  const costs = productCosts(pre.products, costing);
  const sales = (from: string, to: string) => actuals(pre.orders, from, to, (id) => hampers.has(id), costs);
  const yearly = params.p === "tahun";
  const ym = params.m;
  const year = params.y;

  const nav = yearly
    ? { prev: targetHref({ v: "target", p: "tahun", y: year - 1 }), next: targetHref({ v: "target", p: "tahun", y: year + 1 }) }
    : { prev: targetHref({ v: "target", m: shiftMonth(ym, -1) }), next: targetHref({ v: "target", m: shiftMonth(ym, 1) }) };
  const dim = daysInMonth(ym);
  const el = elapsedDays(ym, today);
  const periodSub = yearly ? `Jan–Des ${year}` : el === dim ? "Bulan selesai" : el === 0 ? "Belum mulai" : `Hari ke-${el} dari ${dim}`;

  let cards: CardProps[];
  let editor: React.ReactNode = null;
  let note: string;
  let warn: React.ReactNode = null;
  let chart: React.ReactNode = null;

  if (!yearly) {
    const t = monthTarget(plans.monthTargets, ym);
    const v = t.values;
    const a = sales(`${ym}-01`, `${ym}-${String(dim).padStart(2, "0")}`);
    const o = { elapsed: el, total: dim };
    const total = a.preorder + a.hampers + (a.cafe ?? 0);
    const cafeMissing = "Laporan kafe (Majoo) belum ada";
    cards = [
      { label: "Omzet total", src: a.cafe == null ? "Pre-order + hampers · kafe menyusul" : "Kafe + pre-order + hampers", value: total, target: monthRevenueTarget(v), prog: progress(total, monthRevenueTarget(v), o) },
      { label: "Omzet kafe", src: "Laporan Majoo", value: a.cafe, target: v.cafe, prog: progress(a.cafe, v.cafe, o), missing: cafeMissing },
      { label: "Pre-order pastry & frozen", src: "Order", value: a.preorder, target: v.preorder, prog: progress(a.preorder, v.preorder, o) },
      { label: "Hampers", src: "Order · kategori hampers", value: a.hampers, target: v.hampers, prog: progress(a.hampers, v.hampers, o) },
      { label: "Dari website", src: "Checkout web · bagian dari pre-order & hampers", value: a.web, target: v.web, prog: progress(a.web, v.web, o) },
      { label: "Jumlah order", src: "Order", value: a.orders, target: v.orders, prog: progress(a.orders, v.orders, o), fmt: count },
      { label: "Rata-rata nilai order", src: "Order", value: a.orders ? a.avgOrder : null, target: v.avgOrder, prog: progress(a.orders ? a.avgOrder : null, v.avgOrder, { project: false }), missing: "Belum ada order" },
      { label: "Food cost", src: "Costing × order", value: a.foodCost, target: v.foodCost, prog: progress(a.foodCost, v.foodCost, { lowerIsBetter: true }), fmt: pct, lowerIsBetter: true },
    ];
    note = t.own
      ? "Target khusus bulan ini."
      : t.from
        ? `Ikut target ${monthLabel(t.from)}. Ubah kalau bulan ini beda, mis. musim Lebaran.`
        : "Belum ada target. Isi sekali, bulan berikutnya otomatis ikut.";
    if (isAlto) editor = <MonthTargetForm month={ym} values={v} />;
  } else {
    const t = yearTarget(plans.monthTargets, plans.yearTargets, year);
    const a = sales(`${year}-01-01`, `${year}-12-31`);
    const yDays = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / 86_400_000;
    const tYear = Number(today.slice(0, 4));
    const yEl = year < tYear ? yDays : year > tYear ? 0 : (Date.parse(today) - Date.UTC(year, 0, 1)) / 86_400_000 + 1;
    const o = { elapsed: yEl, total: yDays };
    const total = a.preorder + a.hampers + (a.cafe ?? 0);
    cards = [
      { label: `Omzet total ${year}`, src: t.auto ? "Target = jumlah 12 target bulanan" : "Target tahunan dari Alto", value: total, target: t.revenue, prog: progress(total, t.revenue, o) },
      { label: `Jumlah order ${year}`, src: "Order", value: a.orders, target: t.orders, prog: progress(a.orders, t.orders, o), fmt: count },
    ];
    note = t.auto ? "Target tahunan otomatis dari jumlah 12 target bulanan. Isi sendiri kalau mau angka lain." : "Target tahunan diisi Alto.";
    if (!t.auto && t.revenue != null && t.sum.revenue != null && Math.abs(t.revenue - t.sum.revenue) > t.revenue * 0.01) {
      const diff = t.revenue - t.sum.revenue;
      warn = (
        <Panel className="flex flex-col gap-2 border-brand-wine/45 px-4 py-3">
          <p className="text-sm">
            Target tahunan {formatRupiah(t.revenue)}, tapi jumlah 12 target bulanan {formatRupiah(t.sum.revenue)} ({diff > 0 ? "kurang" : "lebih"}{" "}
            {formatRupiah(Math.abs(diff))}). Naikkan target bulanan, atau pakai jumlah bulanan sebagai target tahunan.
          </p>
          {isAlto && <ResetYearButton year={year} />}
        </Panel>
      );
    }
    if (isAlto) editor = <YearTargetForm year={year} revenue={t.revenue} orders={t.orders} />;

    // Month bars: sales vs the month's revenue target (marker line).
    const months = Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const s = sales(`${key}-01`, `${key}-${String(daysInMonth(key)).padStart(2, "0")}`);
      return { i, key, value: s.preorder + s.hampers + (s.cafe ?? 0), target: monthRevenueTarget(monthTarget(plans.monthTargets, key).values) };
    });
    const max = Math.max(1, ...months.map((m) => Math.max(m.value, m.target ?? 0)));
    const cur = today.slice(0, 7);
    chart = (
      <Panel className="px-4 py-3.5">
        <p className="mb-2 text-[13px] font-bold">Omzet per bulan · garis = target</p>
        <div className="grid grid-cols-12 items-end gap-1" style={{ height: 160 }}>
          {months.map((m) => (
            <div key={m.key} className="relative flex h-full flex-col justify-end" title={`${MONTHS[m.i]}: ${formatRupiah(m.value)}`}>
              {m.target != null && <span className="absolute inset-x-0 h-0.5 bg-brand-espresso" style={{ bottom: `${(m.target / max) * 100}%` }} />}
              <span
                className={`block rounded-t-sm ${m.key > cur ? "bg-transparent" : m.target != null && m.value < m.target ? "bg-brand-wine" : "bg-brand-olive"}`}
                style={{ height: `${Math.max(1.5, (m.value / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-12 gap-1 text-center text-[10px] font-bold text-brand-muted nav:text-[11px]">
          {MONTHS_SHORT.map((l, i) => (
            <span key={l} className={`${year}-${String(i + 1).padStart(2, "0")}` === cur ? "text-brand-wine" : ""}>{l}</span>
          ))}
        </div>
      </Panel>
    );
  }

  // Campaign targets: boxes vs quota, sales vs target revenue (set in Lainnya › Campaign).
  const campaigns = pre.campaigns.filter((c) => c.isActive && (c.quota || c.targetRevenue));

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <ChipLink href={targetHref({ v: "target", m: ym })} active={!yearly}>Bulanan</ChipLink>
          <ChipLink href={targetHref({ v: "target", p: "tahun", y: year })} active={yearly}>Tahunan</ChipLink>
        </div>
        <div className="flex items-center gap-2">
          <Link href={nav.prev} aria-label="Sebelumnya" className="flex size-11 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/22 bg-white">
            <Icon name="chevron_left" size={22} />
          </Link>
          <span className="min-w-[150px] text-center">
            <b className="block font-display text-[17px] leading-tight">{yearly ? `Tahun ${year}` : monthLabel(ym)}</b>
            <span className="text-xs text-brand-muted">{periodSub}</span>
          </span>
          <Link href={nav.next} aria-label="Berikutnya" className="flex size-11 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/22 bg-white">
            <Icon name="chevron_right" size={22} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3">
        {cards.map((c) => (
          <TargetCard key={c.label} {...c} />
        ))}
      </div>

      {chart}
      {warn}

      <div className="flex flex-col gap-2">
        <SectionLabel>Angka target · {yearly ? `Tahun ${year}` : monthLabel(ym)}</SectionLabel>
        <p className="text-sm text-brand-muted">{note}</p>
        {editor ?? <p className="text-sm text-brand-muted">Hanya Alto yang bisa mengubah target.</p>}
      </div>

      {campaigns.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionLabel>Target per campaign · diatur di Lainnya › Campaign</SectionLabel>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-3">
            {campaigns.map((c) => {
              const box = campaignUsed(c, pre.orders);
              const omzet = pre.orders.filter((o) => o.campaignId === c.id && o.status !== "batal").reduce((s, o) => s + o.subtotal - o.discount, 0);
              const start = c.fulfillStart ?? c.preorderOpen;
              const end = c.fulfillEnd ?? c.preorderClose;
              const row = (label: string, v: number, t: number, fmt: (n: number) => string) => {
                const p = progress(v, t, { project: false });
                return (
                  <div className="flex flex-col gap-1">
                    <span className="flex justify-between gap-2 text-[13px]">
                      <b>{label}</b>
                      <b className="tabular-nums">{fmt(v)}</b>
                    </span>
                    <span className="h-2 overflow-hidden rounded-full bg-brand-espresso/10">
                      <span className={`block h-full rounded-full ${p.ok ? "bg-brand-olive" : "bg-brand-wine"}`} style={{ width: `${p.bar}%` }} />
                    </span>
                    <span className={`text-[13px] ${p.ok ? "text-brand-olive" : "text-brand-wine"}`}>{p.pct}% dari {fmt(t)}</span>
                  </div>
                );
              };
              return (
                <Panel key={c.id} className="flex flex-col gap-2.5 px-4 py-3.5">
                  <div>
                    <h3 className="font-display text-[17px] font-bold">{c.name}</h3>
                    <p className="text-[13px] text-brand-muted">{formatDateId(start, false)} – {formatDateId(end, false)}</p>
                  </div>
                  {c.quota ? row("Box terjual", box, c.quota, count) : null}
                  {c.targetRevenue ? row("Omzet", omzet, c.targetRevenue, formatRupiah) : null}
                </Panel>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
