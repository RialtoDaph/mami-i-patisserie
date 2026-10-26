import Link from "next/link";
import type { PreorderData } from "@/lib/preorderData";
import type { PlansData } from "@/lib/plansData";
import { formatDateId } from "@/lib/preorder";
import { milestoneState, type MilestoneState } from "@/lib/plans";
import { Icon } from "@/components/brand";
import { EmptyNote } from "@/components/app/ui";
import { MONTHS, MONTHS_SHORT, targetHref, type TargetParams } from "./params";

type Tone = MilestoneState | "goal" | "campaign";

interface Item {
  month: number;
  text: string;
  tone: Tone;
}

interface Row {
  label: string;
  sub: string;
  items: Item[];
  /** Campaign period [from, to] month index, shaded. */
  span?: [number, number];
}

const TONE: Record<Tone, string> = {
  belum: "border border-brand-espresso/25 bg-white text-brand-espresso",
  jalan: "bg-brand-butter text-brand-espresso",
  selesai: "bg-brand-pistachio-50 text-brand-olive",
  telat: "bg-brand-wine-50 text-brand-wine",
  goal: "bg-brand-espresso text-brand-butter",
  campaign: "bg-brand-wine text-brand-butter",
};

const LEGEND: [string, string][] = [
  ["Belum mulai", "border border-brand-espresso/25 bg-white"],
  ["Sedang jalan", "bg-brand-butter"],
  ["Selesai", "bg-brand-pistachio-50"],
  ["Telat", "bg-brand-wine-50"],
  ["Campaign", "bg-brand-wine/15"],
];

/** 12-month timeline: goal milestones (+ goal target date) and campaigns. Grid on wide screens, month list on phones. */
export function RoadmapView({ params, today, plans, pre }: { params: TargetParams; today: string; plans: PlansData; pre: PreorderData }) {
  const year = params.ry;
  const inYear = (iso: string) => Number(iso.slice(0, 4)) === year;
  const monthOf = (iso: string) => Number(iso.slice(5, 7)) - 1;
  const curMonth = Number(today.slice(0, 4)) === year ? Number(today.slice(5, 7)) - 1 : -1;

  const rows: Row[] = [];
  for (const g of plans.goals) {
    const items: Item[] = g.milestones
      .filter((m) => inYear(m.dueDate))
      .map((m) => ({ month: monthOf(m.dueDate), text: m.title, tone: milestoneState(m, today) }));
    if (inYear(g.dueDate)) items.push({ month: monthOf(g.dueDate), text: "★ Target goal", tone: "goal" });
    if (items.length) rows.push({ label: g.title, sub: `${g.area} · ${plans.team.find((t) => t.id === g.pic)?.name ?? "–"}`, items });
  }
  for (const c of pre.campaigns.filter((x) => x.isActive)) {
    const start = c.fulfillStart ?? c.preorderOpen;
    const end = c.fulfillEnd ?? c.preorderClose;
    const sy = Number(start.slice(0, 4));
    const ey = Number(end.slice(0, 4));
    if (sy > year || ey < year) continue;
    const a = sy === year ? monthOf(start) : 0;
    const b = ey === year ? monthOf(end) : 11;
    rows.push({
      label: `Campaign: ${c.name}`,
      sub: `${formatDateId(start, false)} – ${formatDateId(end, false)}`,
      items: [{ month: a, text: c.quota ? `Kuota ${c.quota} box` : "Mulai", tone: "campaign" }],
      span: [a, b],
    });
  }

  const byMonth = MONTHS.map((label, i) => ({
    label,
    i,
    items: rows.flatMap((r) => r.items.filter((x) => x.month === i).map((x) => ({ ...x, row: r.label }))),
  })).filter((m) => m.items.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={targetHref({ v: "roadmap", ry: year - 1 })} aria-label="Tahun sebelumnya" className="flex size-11 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/22 bg-white">
            <Icon name="chevron_left" size={22} />
          </Link>
          <b className="min-w-[64px] text-center font-display text-xl">{year}</b>
          <Link href={targetHref({ v: "roadmap", ry: year + 1 })} aria-label="Tahun berikutnya" className="flex size-11 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/22 bg-white">
            <Icon name="chevron_right" size={22} />
          </Link>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {LEGEND.map(([l, c]) => (
            <li key={l} className="flex items-center gap-1.5 text-xs font-bold text-brand-muted">
              <span className={`size-3 rounded-sm ${c}`} />
              {l}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[13px] text-brand-muted">Gabungan milestone dari Goals dan campaign. Alat &ldquo;Akan ada&rdquo; menyusul bersama menu Alat.</p>

      {rows.length === 0 ? (
        <EmptyNote>Belum ada rencana di {year}.</EmptyNote>
      ) : (
        <>
          {/* Wide: grid */}
          <div className="hidden overflow-x-auto rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 nav:block">
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left">
              <thead>
                <tr className="text-[11px] tracking-wider uppercase">
                  <th className="w-[200px] border-b border-brand-espresso/12 px-3 py-2" />
                  {MONTHS_SHORT.map((m, i) => (
                    <th key={m} className={`border-b border-l border-brand-espresso/12 px-1 py-2 text-center font-bold ${i === curMonth ? "text-brand-wine" : "text-brand-pistachio-deep"}`}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="align-top">
                    <th scope="row" className="border-t border-brand-espresso/12 px-3 py-2 text-left">
                      <span className="block text-[13px] leading-snug font-bold">{r.label}</span>
                      <span className="block text-[11px] font-normal text-brand-muted">{r.sub}</span>
                    </th>
                    {MONTHS_SHORT.map((m, i) => (
                      <td key={m} className={`border-t border-l border-brand-espresso/12 p-1 ${r.span && i >= r.span[0] && i <= r.span[1] ? "bg-brand-wine/12" : ""}`}>
                        <span className="flex flex-col gap-1">
                          {r.items.filter((x) => x.month === i).map((x, k) => (
                            <span key={k} className={`rounded px-1.5 py-1 text-[11px] leading-tight font-bold break-words ${TONE[x.tone]}`}>{x.text}</span>
                          ))}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: list per month */}
          <ul className="flex flex-col gap-2 nav:hidden">
            {byMonth.map((m) => (
              <li key={m.label} className="rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-4 py-3">
                <p className={`mb-1.5 flex justify-between font-display text-[16px] font-bold ${m.i === curMonth ? "text-brand-wine" : ""}`}>
                  {m.label}
                  <span className="font-sans text-xs font-bold text-brand-muted">{m.items.length} rencana</span>
                </p>
                <ul className="flex flex-col gap-1.5">
                  {m.items.map((x, k) => (
                    <li key={k} className="flex items-start gap-2">
                      <span className={`flex-none rounded px-1.5 py-0.5 text-xs font-bold ${TONE[x.tone]}`}>{x.text}</span>
                      <span className="pt-0.5 text-xs text-brand-muted">{x.row}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
