"use client";

import { useMemo, useState, useTransition } from "react";
import {
  computeBundleCost, costLine, createContext, DEFAULT_TARGET_HPP_PCT, hppPct, hppStatus, suggestedPrice,
  type CostItem, type CostingData,
} from "@/lib/costing";
import { saveBundle } from "@/lib/actions";
import { formatNumber, formatRupiah, parseNumberInput } from "@/lib/format";
import { ItemsEditor, parseRow, rowsFromItems, type ItemRow, type OptionGroup } from "@/components/ItemsEditor";
import { ErrorBox, HppBadge, Row } from "@/components/ui";

export interface BundleFormValues {
  id: string;
  name: string;
  sellingPrice: number | null;
  targetHppPct: number;
  isActive: boolean;
  notes: string | null;
  items: CostItem[];
}

export function BundleForm({ initial, data }: { initial: BundleFormValues | null; data: CostingData }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [price, setPrice] = useState(initial?.sellingPrice != null ? formatNumber(initial.sellingPrice) : "");
  const [target, setTarget] = useState(formatNumber(initial?.targetHppPct ?? DEFAULT_TARGET_HPP_PCT, 2));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [rows, setRows] = useState<ItemRow[]>(initial ? rowsFromItems(initial.items) : []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const groups: OptionGroup[] = useMemo(() => {
    const rec = (sub: boolean) =>
      data.recipes
        .filter((r) => (r.category === "sub_resep") === sub)
        .map((r) => ({ ref: `r:${r.id}`, name: r.name, unit: r.yieldUnit }));
    const ing = (cat: "bahan" | "kemasan") =>
      data.ingredients.filter((i) => i.category === cat).map((i) => ({ ref: `i:${i.id}`, name: i.name, unit: i.baseUnit }));
    return [
      { label: "Produk (resep)", options: rec(false) },
      { label: "Kemasan & kartu", options: ing("kemasan") },
      { label: "Bahan / produk supplier", options: ing("bahan") },
      { label: "Isian / sub-resep", options: rec(true) },
    ];
  }, [data]);

  const parsed = useMemo(() => rows.map((r) => parseRow(r, parseNumberInput)), [rows]);
  const priceN = parseNumberInput(price);
  const targetN = parseNumberInput(target) ?? DEFAULT_TARGET_HPP_PCT;

  const preview = useMemo(() => {
    const ctx = createContext(data.ingredients, data.recipes);
    const valid = parsed.filter((p) => p.id && p.quantity != null && p.quantity > 0);
    const items: CostItem[] = valid.map((p) => ({ source: { kind: p.kind, id: p.id }, quantity: p.quantity!, unit: p.unit }));
    const lineCosts = parsed.map((p) => {
      if (!p.id || p.quantity == null || !(p.quantity > 0)) return null;
      try {
        return costLine(ctx, { source: { kind: p.kind, id: p.id }, quantity: p.quantity, unit: p.unit }).cost;
      } catch {
        return null;
      }
    });
    try {
      const cost = computeBundleCost(ctx, { items }).cost;
      const hpp = hppPct(cost, priceN);
      return { lineCosts, cost, hpp, status: hppStatus(hpp, targetN), error: null };
    } catch (e) {
      return { lineCosts, cost: null, hpp: null, status: "unknown" as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [parsed, data, priceN, targetN]);

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await saveBundle({
        id: initial?.id ?? null,
        name,
        sellingPrice: priceN,
        targetHppPct: targetN,
        isActive,
        notes,
        items: parsed.map((p) => ({ kind: p.kind, id: p.id, quantity: p.quantity ?? 0, unit: p.unit })),
      });
      if (res?.error) setError(res.error);
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <label>
        <span className="field-label">Nama paket</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="mis. Blessings Box" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="field-label">Harga jual (Rp)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className="input" placeholder="250.000" />
        </label>
        <label>
          <span className="field-label">Target HPP (%)</span>
          <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" className="input" />
        </label>
      </div>

      <section>
        <h2 className="mb-2 font-bold text-cocoa">Isi paket</h2>
        <ItemsEditor rows={rows} groups={groups} lineCosts={preview.lineCosts} onChange={setRows} addLabel="Tambah isi" />
      </section>

      <section className="card bg-crust/60">
        <div className="mb-2 flex items-start justify-between">
          <h2 className="font-bold text-cocoa">Perhitungan</h2>
          <HppBadge hpp={preview.hpp} status={preview.status} />
        </div>
        {preview.error ? (
          <p className="text-sm font-semibold text-bad">⚠ {preview.error}</p>
        ) : (
          preview.cost != null && (
            <>
              <Row label="Biaya paket" value={formatRupiah(preview.cost)} strong />
              <Row label="Saran harga (Rp 1.000)" value={formatRupiah(suggestedPrice(preview.cost, targetN, 1000))} />
            </>
          )
        )}
      </section>

      <label className="flex min-h-12 items-center gap-3">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-6 accent-cocoa" />
        <span className="font-semibold">Aktif (tampil di ringkasan)</span>
      </label>
      <label>
        <span className="field-label">Catatan (opsional)</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input py-2" />
      </label>

      <ErrorBox message={error} />
      <div className="sticky bottom-20 z-10">
        <button type="submit" disabled={pending} className="btn-primary w-full shadow-lg">
          {pending ? "Menyimpan…" : "Simpan paket"}
        </button>
      </div>
    </form>
  );
}
