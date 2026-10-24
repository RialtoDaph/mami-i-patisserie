import type { Metadata } from "next";
import { loadCostingData } from "@/lib/data";
import { loadPreorderData } from "@/lib/preorderData";
import { addDays, formatDateId, needLabel, todayJakarta } from "@/lib/preorder";
import { parseShoppingParams, shoppingQuery } from "@/lib/shoppingParams";
import { ChipLink, EmptyNote, Panel } from "@/components/app/ui";
import { ProductionTabs } from "../ProductionTabs";
import { buildShoppingList } from "../shopping";
import { ShoppingChecklist } from "./ShoppingChecklist";

export const metadata: Metadata = { title: "Daftar belanja" };

const checkClass = "size-6 accent-brand-wine";

export default async function ShoppingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const today = todayJakarta();
  const p = parseShoppingParams(await searchParams, today);
  const [pre, costing] = await Promise.all([loadPreorderData(), loadCostingData()]);
  const list = buildShoppingList(pre, costing, p);
  const range = `${formatDateId(p.from, false)} – ${formatDateId(p.to, false)}`;
  const quick = (days: number) => shoppingQuery({ ...p, from: today, to: addDays(today, days - 1) });

  return (
    <div className="flex flex-col gap-4">
      <ProductionTabs active="belanja" />
      <div className="flex flex-wrap gap-2">
        {[7, 14].map((n) => (
          <ChipLink key={n} href={`?${quick(n)}`} active={p.from === today && p.to === addDays(today, n - 1)}>{n} hari ke depan</ChipLink>
        ))}
      </div>
      <details className="rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-4" open={p.roundBatches || p.onlyPaidDp || !p.useStock || undefined}>
        <summary className="flex min-h-12 cursor-pointer items-center text-[15px] font-bold">Atur tanggal &amp; pilihan</summary>
        <form className="flex flex-col gap-3 pb-4" method="get">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-brand-pistachio-deep">Dari tanggal</span>
              <input type="date" name="dari" defaultValue={p.from} className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-brand-pistachio-deep">Sampai</span>
              <input type="date" name="sampai" defaultValue={p.to} className="input" />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="stok" value="1" defaultChecked={p.useStock} className={checkClass} />
            <span>Kurangi dengan stok dapur</span>
          </label>
          {/* Comes after the checkbox: the first "stok" value wins, so this only counts when the box is unticked. */}
          <input type="hidden" name="stok" value="0" />
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="bulat" value="1" defaultChecked={p.roundBatches} className={checkClass} />
            <span>Bulatkan ke adonan penuh</span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="dp" value="1" defaultChecked={p.onlyPaidDp} className={checkClass} />
            <span>Hanya order yang sudah DP</span>
          </label>
          <button type="submit" className="btn-secondary w-full">Tampilkan</button>
        </form>
      </details>

      <p className="text-[13px] text-brand-muted">
        Untuk <b className="text-brand-espresso">{list.orderCount} order</b> tanggal ambil/kirim {range}
        {p.onlyPaidDp ? " (sudah DP)" : " (semua kecuali batal)"}. {p.useStock ? "Sudah dikurangi stok dapur." : "Stok dapur tidak dihitung."}{" "}
        {p.roundBatches ? "Resep dibulatkan ke adonan penuh." : ""}
      </p>

      {list.rows.length === 0 ? (
        <EmptyNote>{list.covered.length ? "Semua kebutuhan sudah cukup dari stok dapur." : "Tidak ada yang perlu dibeli untuk periode ini."}</EmptyNote>
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

      {list.covered.length > 0 && (
        <Panel>
          <details>
            <summary className="cursor-pointer text-[15px] font-bold">Cukup dari stok ({list.covered.length})</summary>
            <ul className="mt-2 flex flex-col gap-1 text-[15px]">
              {list.covered.map((r) => (
                <li key={r.ingredientId} className="flex justify-between gap-2">
                  <span>{r.name}</span>
                  <span className="text-brand-muted tabular-nums">butuh {needLabel(r.needQty, r.baseUnit)} · stok {needLabel(r.stockQty ?? 0, r.baseUnit)}</span>
                </li>
              ))}
            </ul>
          </details>
        </Panel>
      )}
    </div>
  );
}
