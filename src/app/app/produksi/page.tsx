import Link from "next/link";
import type { Metadata } from "next";
import { loadCostingData } from "@/lib/data";
import { loadPreorderData } from "@/lib/preorderData";
import {
  addDays, currentCampaign, formatDateId, ingredientNeeds, isIsoDate, productionSchedule, productQuantities, todayJakarta,
} from "@/lib/preorder";
import { ProductionDay, type DayIngredient } from "@/components/ProductionDay";
import { ChipLink, EmptyNote } from "@/components/app/ui";
import { Icon } from "@/components/brand";
import { ProductionTabs } from "./ProductionTabs";

export const metadata: Metadata = { title: "Produksi" };

const RANGES = [
  { days: 1, label: "Hari ini" },
  { days: 7, label: "7 hari" },
  { days: 14, label: "14 hari" },
];

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ dari?: string; hari?: string }> }) {
  const sp = await searchParams;
  const today = todayJakarta();
  const from = sp.dari && isIsoDate(sp.dari) ? sp.dari : today;
  const days = RANGES.some((r) => String(r.days) === sp.hari) ? Number(sp.hari) : 7;
  const [pre, costing] = await Promise.all([loadPreorderData(), loadCostingData()]);
  const schedule = productionSchedule(pre.orders, pre.products, costing.recipes, costing.bundles, from, days).filter(
    (d) => d.products.length > 0 || d.date === today,
  );
  const ingName = new Map(costing.ingredients.map((i) => [i.id, i]));
  const dayIngredients = (date: string): DayIngredient[] => {
    const dayOrders = pre.orders.filter((o) => o.fulfillDate === date && o.status !== "batal");
    const needs = ingredientNeeds(productQuantities(dayOrders), pre.products, costing.ingredients, costing.recipes, costing.bundles);
    return [...needs]
      .map(([id, qty]) => ({ id, qty, name: ingName.get(id)?.name ?? "?", unit: ingName.get(id)?.baseUnit ?? "g" }))
      .filter((i) => i.qty > 0);
  };
  const link = (f: string, h: number) => `/app/produksi?dari=${f}&hari=${h}`;

  // Campaign table (prototype: "Hampers Natal 2026"): campaign products per fulfil date, open orders only.
  const campaign = currentCampaign(pre.campaigns, today);
  const campaignProducts = campaign ? campaign.products.flatMap((cp) => pre.products.filter((p) => p.id === cp.productId)) : [];
  const campaignOrders = campaign ? pre.orders.filter((o) => o.campaignId === campaign.id && o.status !== "batal" && o.status !== "selesai") : [];
  const campaignDates = [...new Set(campaignOrders.map((o) => o.fulfillDate))].sort();
  const cell = (date: string, productId: string) =>
    campaignOrders.filter((o) => o.fulfillDate === date).reduce((s, o) => s + o.items.filter((i) => i.productId === productId).reduce((t, i) => t + i.qty, 0), 0);
  const campaignBoxes = campaignDates.reduce((s, d) => s + campaignProducts.reduce((t, p) => t + cell(d, p.id), 0), 0);
  const natal = campaign?.slug?.startsWith("natal") ?? false;

  return (
    <div className="flex flex-col gap-4">
      {campaign && campaignDates.length > 0 && (
        <section className="overflow-hidden rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50">
          <div className={`flex items-baseline justify-between gap-3 px-4 py-3 ${natal ? "bg-brand-natal" : "bg-brand-espresso"} text-brand-butter`}>
            <h2 className="font-display text-[17px] font-bold">{campaign.name}</h2>
            <span className="text-[13px] font-bold">{campaignBoxes} box</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-[15px] tabular-nums">
              <thead>
                <tr className="text-[11px] tracking-wider text-brand-pistachio-deep uppercase">
                  <th className="px-4 py-2 text-left font-bold">Tanggal</th>
                  {campaignProducts.map((p) => (
                    <th key={p.id} className="px-4 py-2 text-right font-bold">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaignDates.map((d) => (
                  <tr key={d} className="border-t border-brand-espresso/8">
                    <td className="px-4 py-2 font-bold whitespace-nowrap">{formatDateId(d, true).replace(/ \d{4}$/, "")}</td>
                    {campaignProducts.map((p) => {
                      const n = cell(d, p.id);
                      return <td key={p.id} className="px-4 py-2 text-right">{n || "–"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-brand-espresso/8 px-4 py-2 text-xs text-brand-muted">
            Order {campaign.name} yang belum selesai, dikelompokkan menurut tanggal ambil atau kirim.
          </p>
        </section>
      )}

      <ProductionTabs active="jadwal" />

      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <ChipLink key={r.days} href={link(today, r.days)} active={from === today && days === r.days}>{r.label}</ChipLink>
        ))}
        <span className="ml-auto flex gap-1">
          <Link href={link(addDays(from, -days), days)} aria-label="Sebelumnya" className="flex size-10 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/22">
            <Icon name="chevron_left" size={22} />
          </Link>
          <Link href={link(addDays(from, days), days)} aria-label="Berikutnya" className="flex size-10 items-center justify-center rounded-md border-[1.5px] border-brand-espresso/22">
            <Icon name="chevron_right" size={22} />
          </Link>
        </span>
      </div>
      <p className="-mt-2 text-[13px] text-brand-muted">
        {formatDateId(from, false)}{days > 1 && ` – ${formatDateId(addDays(from, days - 1), false)}`} · per tanggal ambil/kirim, order batal tidak dihitung.
      </p>

      {schedule.every((d) => d.products.length === 0) ? (
        <EmptyNote>Tidak ada yang perlu dibuat di rentang ini.</EmptyNote>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] items-start gap-3">
          {schedule.filter((d) => d.products.length > 0).map((d) => (
            <ProductionDay key={d.date} day={d} today={today} ingredients={dayIngredients(d.date)} />
          ))}
        </div>
      )}
    </div>
  );
}
