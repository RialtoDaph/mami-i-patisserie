import Link from "next/link";
import type { Metadata } from "next";
import { loadCostingData } from "@/lib/data";
import { loadPreorderData } from "@/lib/preorderData";
import { addDays, formatDateId, todayJakarta } from "@/lib/preorder";
import { parseShoppingParams, shoppingQuery } from "@/lib/shoppingParams";
import { PageHeader } from "@/components/ui";
import { ProductionTabs } from "../ProductionTabs";
import { buildShoppingList } from "../shopping";
import { ShoppingChecklist } from "./ShoppingChecklist";

export const metadata: Metadata = { title: "Daftar belanja" };

export default async function ShoppingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = todayJakarta();
  const p = parseShoppingParams(await searchParams, today);
  const [pre, costing] = await Promise.all([loadPreorderData(), loadCostingData()]);
  const list = buildShoppingList(pre, costing, p);
  const range = `${formatDateId(p.from, false)} – ${formatDateId(p.to, false)}`;
  const quick = (days: number) => shoppingQuery({ ...p, from: today, to: addDays(today, days - 1) });

  return (
    <>
      <PageHeader title="Daftar belanja" />
      <ProductionTabs active="belanja" />

      <div className="mb-3 flex flex-wrap gap-2">
        {[7, 14].map((n) => {
          const on = p.from === today && p.to === addDays(today, n - 1);
          return <Link key={n} href={`?${quick(n)}`} className={on ? "chip-on" : "chip-off"}>{n} hari ke depan</Link>;
        })}
      </div>
      <details className="card mb-4" open={p.roundBatches || p.onlyPaidDp || undefined}>
        <summary className="min-h-8 cursor-pointer font-semibold text-cocoa">Atur tanggal &amp; pilihan</summary>
        <form className="mt-3 flex flex-col gap-3" method="get">
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="field-label">Dari tanggal</span>
              <input type="date" name="dari" defaultValue={p.from} className="input" />
            </label>
            <label>
              <span className="field-label">Sampai</span>
              <input type="date" name="sampai" defaultValue={p.to} className="input" />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="bulat" value="1" defaultChecked={p.roundBatches} className="size-6 accent-brand-espresso" />
            <span>Bulatkan ke batch penuh</span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="dp" value="1" defaultChecked={p.onlyPaidDp} className="size-6 accent-brand-espresso" />
            <span>Hanya order yang sudah DP</span>
          </label>
          <button type="submit" className="btn-secondary w-full">Tampilkan</button>
        </form>
      </details>

      <p className="mb-3 text-sm text-muted">
        Untuk <b className="text-ink">{list.orderCount} order</b> tanggal ambil/kirim {range}
        {p.onlyPaidDp ? " (sudah DP)" : " (semua kecuali batal)"}.{" "}
        {p.roundBatches ? "Resep dibulatkan ke batch penuh." : "Jumlah sesuai kebutuhan pas."}
      </p>

      {list.products.length > 0 && (
        <details className="card mb-4">
          <summary className="cursor-pointer font-semibold text-cocoa">Produk yang dibuat ({list.products.length})</summary>
          <ul className="mt-2 flex flex-col gap-1">
            {list.products.map((x) => (
              <li key={x.id} className="flex justify-between gap-2"><span>{x.name}</span><b className="tabular-nums">{x.qty}</b></li>
            ))}
          </ul>
        </details>
      )}

      {list.rows.length === 0 ? (
        <p className="card text-center text-muted">Tidak ada yang perlu dibeli untuk periode ini.</p>
      ) : (
        <ShoppingChecklist
          groups={list.groups}
          totalBuy={list.totalBuy}
          totalUse={list.totalUse}
          storageKey={`mami-belanja-v1:${p.from}:${p.to}`}
          title={`Daftar belanja ${range}`}
          csvHref={`/app/produksi/belanja/export?${shoppingQuery(p)}`}
        />
      )}
    </>
  );
}
