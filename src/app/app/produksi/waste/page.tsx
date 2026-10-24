import type { Metadata } from "next";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadKitchen, loadPreorderData } from "@/lib/preorderData";
import { addDays, countUnit, formatDateId, monthRange, productCosts, todayJakarta, WASTE_REASON_LABEL } from "@/lib/preorder";
import { pricePerBaseUnit } from "@/lib/costing";
import { formatNumber, formatRupiah } from "@/lib/format";
import { EmptyNote, Panel, SectionLabel } from "@/components/app/ui";
import { ProductionTabs } from "../ProductionTabs";
import { DeleteWasteButton, WasteForm, type WasteOption } from "./WasteForm";

export const metadata: Metadata = { title: "Waste" };

export default async function WastePage() {
  const today = todayJakarta();
  const month = monthRange(today);
  const from = addDays(today, -30) < month.from ? addDays(today, -30) : month.from;
  const [user, pre, costing, kitchen] = await Promise.all([getCurrentUser(), loadPreorderData(), loadCostingData(), loadKitchen(from, today)]);
  const costs = productCosts(pre.products, costing);
  const product = new Map(pre.products.map((p) => [p.id, p]));
  const ingredient = new Map(costing.ingredients.map((i) => [i.id, i]));

  const options: WasteOption[] = [
    ...pre.products.filter((p) => p.isActive).map((p) => ({ value: `p:${p.id}`, label: p.name, group: "Produk" as const, unit: "pcs", packSize: 1 })),
    ...costing.ingredients.map((i) => {
      const { factor, label } = countUnit(i.baseUnit);
      return { value: `i:${i.id}`, label: i.name, group: "Bahan" as const, unit: label, packSize: factor };
    }),
  ];

  const rows = kitchen.waste.map((w) => {
    if (w.productId) {
      const p = product.get(w.productId);
      const unitCost = costs.get(w.productId);
      return { ...w, name: p?.name ?? "?", qtyLabel: `${formatNumber(w.qty, 1)} pcs`, value: unitCost == null ? null : unitCost * w.qty };
    }
    const i = ingredient.get(w.ingredientId!);
    const unit = i ? countUnit(i.baseUnit) : { factor: 1, label: "" };
    return {
      ...w,
      name: i?.name ?? "?",
      qtyLabel: `${formatNumber(w.qty / unit.factor, 3)} ${unit.label}`.trim(),
      value: i ? w.qty * pricePerBaseUnit(i) : null,
    };
  });
  const monthValue = rows.filter((r) => r.date >= month.from).reduce((s, r) => s + (r.value ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <ProductionTabs active="waste" />
      {can(user.role, "waste.add") && <WasteForm options={options} today={today} />}
      <div className="flex items-baseline justify-between gap-3">
        <SectionLabel>30 hari terakhir</SectionLabel>
        <span className="text-[13px] text-brand-muted">
          Bulan ini ± <b className="text-brand-espresso">{formatRupiah(monthValue)}</b>
        </span>
      </div>
      {rows.length === 0 ? (
        <EmptyNote>Belum ada waste tercatat.</EmptyNote>
      ) : (
        <Panel className="overflow-hidden">
          {rows.map((r, n) => (
            <div key={r.id} className={`flex min-h-16 items-center gap-3 px-4 py-2.5 ${n ? "border-t border-brand-espresso/10" : ""}`}>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold">
                  {r.qtyLabel} · {r.name}
                </span>
                <span className="block text-[13px] text-brand-muted">
                  {formatDateId(r.date, true).replace(/ \d{4}$/, "")} · {WASTE_REASON_LABEL[r.reason]}
                  {r.note && ` · ${r.note}`}
                </span>
              </span>
              <span className="text-sm tabular-nums">{r.value == null ? "–" : formatRupiah(r.value)}</span>
              {(can(user.role, "waste.deleteAny") || (r.createdBy === user.id && r.date === today)) && <DeleteWasteButton id={r.id} />}
            </div>
          ))}
        </Panel>
      )}
      <p className="text-xs text-brand-muted">Nilai = HPP produk atau harga bahan per satuan. Dipakai nanti untuk target waste di Laporan.</p>
    </div>
  );
}
