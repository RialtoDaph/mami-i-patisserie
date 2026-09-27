import Link from "next/link";
import type { Metadata } from "next";
import { loadCostingData } from "@/lib/data";
import { loadPreorderData } from "@/lib/preorderData";
import { addDays, formatDateId, isIsoDate, productionSchedule, todayJakarta } from "@/lib/preorder";
import { PageHeader } from "@/components/ui";
import { ProductionDay } from "@/components/ProductionDay";

export const metadata: Metadata = { title: "Produksi" };

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ dari?: string; hari?: string }> }) {
  const sp = await searchParams;
  const today = todayJakarta();
  const from = sp.dari && isIsoDate(sp.dari) ? sp.dari : today;
  const days = sp.hari === "30" ? 30 : sp.hari === "7" ? 7 : 14;
  const [pre, costing] = await Promise.all([loadPreorderData(), loadCostingData()]);
  const schedule = productionSchedule(pre.orders, pre.products, costing.recipes, costing.bundles, from, days);
  const totals = new Map<string, { name: string; qty: number }>();
  for (const d of schedule) for (const p of d.products) {
    const t = totals.get(p.productId) ?? { name: p.name, qty: 0 };
    t.qty += p.qty;
    totals.set(p.productId, t);
  }
  const link = (f: string, h: number) => `/app/produksi?dari=${f}&hari=${h}`;

  return (
    <>
      <PageHeader title="Jadwal produksi" />
      <p className="-mt-2 mb-3 text-sm text-muted">Per tanggal ambil/kirim. Order batal tidak dihitung.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={link(addDays(from, -days), days)} className="chip-off">← Sebelumnya</Link>
        <Link href={link(today, days)} className={from === today ? "chip-on" : "chip-off"}>Hari ini</Link>
        <Link href={link(addDays(from, days), days)} className="chip-off">Berikutnya →</Link>
        {[7, 14, 30].map((h) => (
          <Link key={h} href={link(from, h)} className={days === h ? "chip-on" : "chip-off"}>{h} hari</Link>
        ))}
      </div>

      {totals.size > 0 && (
        <section className="card mb-4 bg-crust/60">
          <h2 className="mb-1 font-bold text-cocoa">
            Total {formatDateId(from, false)} – {formatDateId(addDays(from, days - 1), false)}
          </h2>
          <ul>
            {[...totals.values()].sort((a, b) => b.qty - a.qty).map((t) => (
              <li key={t.name} className="flex justify-between"><span>{t.name}</span><b className="tabular-nums">{t.qty}</b></li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2">
        {schedule.map((d) => <ProductionDay key={d.date} day={d} today={today} />)}
      </div>
    </>
  );
}
