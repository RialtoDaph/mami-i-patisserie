"use client";

import { useMemo, useState, useTransition } from "react";
import {
  allowedSubRecipes, computeRecipeCost, costLine, createContext, DEFAULT_TARGET_HPP_PCT, hppPct, hppStatus,
  suggestedPrice, type CostItem, type CostingData, type Recipe, type RecipeCategory, type YieldUnit,
} from "@/lib/costing";
import { saveRecipe } from "@/lib/actions";
import { formatNumber, formatRupiah, parseNumberInput } from "@/lib/format";
import { RECIPE_CATEGORY_LABEL } from "@/lib/labels";
import { ItemsEditor, parseRow, rowsFromItems, type ItemRow, type OptionGroup } from "@/components/ItemsEditor";
import { ErrorBox, HppBadge, Row } from "@/components/ui";

export interface RecipeFormValues extends Recipe {
  notes: string | null;
}

const YIELD_UNITS: YieldUnit[] = ["pcs", "porsi", "g", "ml"];
const NEW_ID = "__new__";

export function RecipeForm({
  initial,
  data,
  canEditPricing,
}: {
  initial: RecipeFormValues | null;
  data: CostingData;
  canEditPricing: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<RecipeCategory>(initial?.category ?? "mamis");
  const [yieldQty, setYieldQty] = useState(initial ? formatNumber(initial.yieldQty, 3) : "");
  const [yieldUnit, setYieldUnit] = useState<YieldUnit>(initial?.yieldUnit ?? "pcs");
  const [waste, setWaste] = useState(initial ? formatNumber(initial.wastePct, 2) : "0");
  const [target, setTarget] = useState(formatNumber(initial?.targetHppPct ?? DEFAULT_TARGET_HPP_PCT, 2));
  const [price, setPrice] = useState(initial?.sellingPrice != null ? formatNumber(initial.sellingPrice) : "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [rows, setRows] = useState<ItemRow[]>(initial ? rowsFromItems(initial.items) : []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selfId = initial?.id ?? NEW_ID;

  const groups: OptionGroup[] = useMemo(() => {
    const subs = allowedSubRecipes(data.recipes, initial?.id ?? null).filter((r) => r.id !== selfId);
    const ing = (cat: "bahan" | "kemasan") =>
      data.ingredients.filter((i) => i.category === cat).map((i) => ({ ref: `i:${i.id}`, name: i.name, unit: i.baseUnit }));
    return [
      { label: "Bahan", options: ing("bahan") },
      { label: "Isian / sub-resep", options: subs.filter((r) => r.category === "sub_resep").map((r) => ({ ref: `r:${r.id}`, name: r.name, unit: r.yieldUnit })) },
      { label: "Resep lain", options: subs.filter((r) => r.category !== "sub_resep").map((r) => ({ ref: `r:${r.id}`, name: r.name, unit: r.yieldUnit })) },
      { label: "Kemasan", options: ing("kemasan") },
    ];
  }, [data, initial, selfId]);

  const parsed = useMemo(() => rows.map((r) => parseRow(r, parseNumberInput)), [rows]);
  const yieldN = parseNumberInput(yieldQty);
  const wasteN = parseNumberInput(waste) ?? 0;
  const targetN = parseNumberInput(target) ?? DEFAULT_TARGET_HPP_PCT;
  const priceN = canEditPricing ? parseNumberInput(price) : (initial?.sellingPrice ?? null);

  // Live cost preview using the same pure functions as the summary.
  const preview = useMemo(() => {
    const items: CostItem[] = parsed
      .filter((p) => p.id && p.quantity != null && p.quantity > 0)
      .map((p) => ({ source: { kind: p.kind, id: p.id }, quantity: p.quantity!, unit: p.unit }));
    const draft: Recipe = {
      id: selfId, name, category, yieldQty: yieldN ?? 0, yieldUnit, wastePct: wasteN,
      targetHppPct: targetN, sellingPrice: priceN, isActive, items,
    };
    const ctx = createContext(data.ingredients, [...data.recipes.filter((r) => r.id !== selfId), draft]);
    const lineCosts = parsed.map((p) => {
      if (!p.id || p.quantity == null || !(p.quantity > 0)) return null;
      try {
        return costLine(ctx, { source: { kind: p.kind, id: p.id }, quantity: p.quantity, unit: p.unit }).cost;
      } catch {
        return null;
      }
    });
    try {
      const cost = computeRecipeCost(ctx, selfId);
      const hpp = hppPct(cost.costPerUnit, priceN);
      return { lineCosts, cost, hpp, status: hppStatus(hpp, targetN), error: null };
    } catch (e) {
      return { lineCosts, cost: null, hpp: null, status: "unknown" as const, error: e instanceof Error ? e.message : String(e) };
    }
  }, [parsed, selfId, name, category, yieldN, yieldUnit, wasteN, targetN, priceN, isActive, data]);

  const submit = () => {
    setError(null);
    const items = parsed.map((p) => ({ kind: p.kind, id: p.id, quantity: p.quantity ?? 0, unit: p.unit }));
    start(async () => {
      const res = await saveRecipe({
        id: initial?.id ?? null,
        name,
        category,
        yieldQty: yieldN ?? 0,
        yieldUnit,
        wastePct: wasteN,
        targetHppPct: targetN,
        sellingPrice: canEditPricing ? parseNumberInput(price) : null,
        isActive,
        notes,
        items,
      });
      if (res?.error) setError(res.error);
    });
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label>
        <span className="field-label">Nama resep</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="mis. Risol Ragout" />
      </label>

      <div>
        <span className="field-label">Kategori</span>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(RECIPE_CATEGORY_LABEL) as RecipeCategory[]).map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={category === c ? "chip-on" : "chip-off"}>
              {RECIPE_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label>
          <span className="field-label">Hasil jadi per batch</span>
          <input value={yieldQty} onChange={(e) => setYieldQty(e.target.value)} inputMode="decimal" required className="input" placeholder="30" />
        </label>
        <label>
          <span className="field-label">Satuan</span>
          <select value={yieldUnit} onChange={(e) => setYieldUnit(e.target.value as YieldUnit)} className="input w-28">
            {YIELD_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span className="field-label">Susut / waste (%)</span>
        <input value={waste} onChange={(e) => setWaste(e.target.value)} inputMode="decimal" className="input" />
      </label>

      {canEditPricing && (
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="field-label">Harga jual per {yieldUnit} (Rp)</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className="input" placeholder={category === "sub_resep" ? "kosongkan" : "7.000"} />
          </label>
          <label>
            <span className="field-label">Target HPP (%)</span>
            <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" className="input" />
          </label>
        </div>
      )}

      <section>
        <h2 className="mb-2 font-bold text-cocoa">Bahan & isian</h2>
        <ItemsEditor rows={rows} groups={groups} lineCosts={preview.lineCosts} onChange={setRows} addLabel="Tambah bahan" />
      </section>

      <section className="card bg-crust/60">
        <div className="mb-2 flex items-start justify-between">
          <h2 className="font-bold text-cocoa">Perhitungan</h2>
          <HppBadge hpp={preview.hpp} status={preview.status} />
        </div>
        {preview.error ? (
          <p className="text-sm font-semibold text-bad">⚠ {preview.error}</p>
        ) : (
          preview.cost && (
            <>
              <Row label="Biaya per batch" value={formatRupiah(preview.cost.batchCost)} />
              <Row label={`Hasil setelah susut`} value={`${formatNumber(preview.cost.sellableQty, 2)} ${yieldUnit}`} />
              <Row label={`Biaya per ${yieldUnit}`} value={formatRupiah(preview.cost.costPerUnit, yieldUnit === "g" || yieldUnit === "ml" ? 2 : 0)} strong />
              {targetN > 0 && category !== "sub_resep" && (
                <Row label="Saran harga (Rp 1.000)" value={formatRupiah(suggestedPrice(preview.cost.costPerUnit, targetN, 1000))} />
              )}
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
          {pending ? "Menyimpan…" : "Simpan resep"}
        </button>
      </div>
    </form>
  );
}
