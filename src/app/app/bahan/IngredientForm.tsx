"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  baseUnitsFor, pricePerBaseUnit, priceImpact,
  type BaseUnit, type CostingData, type IngredientCategory, type PurchaseUnit,
} from "@/lib/costing";
import { deleteIngredient, saveIngredient, type IngredientFormState } from "@/lib/actions";
import { formatNumber, formatPercent, formatRupiah, parseNumberInput } from "@/lib/format";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorBox } from "@/components/ui";

export interface IngredientFormValues {
  id: string;
  name: string;
  category: IngredientCategory;
  supplier: string | null;
  purchaseUnit: PurchaseUnit;
  purchaseQty: number;
  purchasePrice: number;
  baseUnit: BaseUnit;
  notes: string | null;
}

const PURCHASE_UNITS: { value: PurchaseUnit; label: string }[] = [
  { value: "kg", label: "kg" },
  { value: "liter", label: "liter" },
  { value: "pcs", label: "pcs" },
  { value: "pack", label: "pack" },
];

export function IngredientForm({
  initial,
  data,
  canEdit,
  canDelete,
}: {
  initial: IngredientFormValues | null;
  data: CostingData;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [state, formAction] = useActionState<IngredientFormState, FormData>(saveIngredient, {});
  const [category, setCategory] = useState<IngredientCategory>(initial?.category ?? "bahan");
  const [purchaseUnit, setPurchaseUnit] = useState<PurchaseUnit>(initial?.purchaseUnit ?? "kg");
  const [baseUnit, setBaseUnit] = useState<BaseUnit>(initial?.baseUnit ?? "g");
  const [qtyText, setQtyText] = useState(initial ? formatNumber(initial.purchaseQty, 3) : "1");
  const [priceText, setPriceText] = useState(initial ? formatNumber(initial.purchasePrice) : "");

  const baseOptions = baseUnitsFor(purchaseUnit);
  const effectiveBase = baseOptions.includes(baseUnit) ? baseUnit : baseOptions[0];
  const qty = parseNumberInput(qtyText);
  const price = parseNumberInput(priceText);
  const perBase = qty && qty > 0 && price != null ? pricePerBaseUnit({ purchaseUnit, purchaseQty: qty, purchasePrice: price }) : null;

  // Live preview: which products would go over target with this price.
  // Cheap to recompute on every keystroke: the dataset is small.
  const impact =
    !initial || qty == null || qty <= 0 || price == null
      ? []
      : priceImpact(data, {
          id: initial.id, name: initial.name, category, purchaseUnit, purchaseQty: qty,
          purchasePrice: Math.round(price), baseUnit: effectiveBase,
        });
  const newlyOver = impact.filter((r) => r.newlyOver);

  if (state.saved) {
    return (
      <div className="flex flex-col gap-4">
        <p className="card border-brand-pistachio bg-ok-bg font-semibold text-ink">✓ Tersimpan</p>
        {state.saved.newlyOver.length > 0 ? (
          <div className="card border-bad/30">
            <p className="mb-2 font-bold text-bad">
              ⚠ {state.saved.newlyOver.length} produk sekarang di atas target HPP:
            </p>
            <ul className="flex flex-col gap-1">
              {state.saved.newlyOver.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link href={r.kind === "recipe" ? `/app/resep/${r.id}` : `/app/paket/${r.id}`} className="flex justify-between gap-2 py-1 underline-offset-2 hover:underline">
                    <span>{r.name}</span>
                    <span className="font-bold text-bad">{formatPercent(r.hppAfter)} / {r.targetHppPct}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-muted">Tidak ada produk yang jadi melewati target HPP.</p>
        )}
        <Link href="/app/bahan" className="btn-primary w-full">Kembali ke daftar bahan</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="purchase_unit" value={purchaseUnit} />
      <input type="hidden" name="base_unit" value={effectiveBase} />

      <fieldset disabled={!canEdit} className="flex flex-col gap-4">
        <label>
          <span className="field-label">Nama</span>
          <input name="name" defaultValue={initial?.name} required className="input" placeholder="mis. Tepung terigu" />
        </label>

        <div>
          <span className="field-label">Jenis</span>
          <div className="grid grid-cols-2 gap-2">
            {(["bahan", "kemasan"] as const).map((c) => (
              <button key={c} type="button" onClick={() => setCategory(c)} className={category === c ? "chip-on" : "chip-off"}>
                {c === "bahan" ? "Bahan" : "Kemasan"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">Dibeli per</span>
          <div className="grid grid-cols-4 gap-2">
            {PURCHASE_UNITS.map((u) => (
              <button key={u.value} type="button" onClick={() => setPurchaseUnit(u.value)} className={purchaseUnit === u.value ? "chip-on" : "chip-off"}>
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {purchaseUnit === "pack" && (
          <div>
            <span className="field-label">Isi pack diukur dalam</span>
            <div className="grid grid-cols-3 gap-2">
              {baseOptions.map((b) => (
                <button key={b} type="button" onClick={() => setBaseUnit(b)} className={effectiveBase === b ? "chip-on" : "chip-off"}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="field-label">{purchaseUnit === "pack" ? `Isi per pack (${effectiveBase})` : `Jumlah (${purchaseUnit})`}</span>
            <input name="purchase_qty" inputMode="decimal" value={qtyText} onChange={(e) => setQtyText(e.target.value)} required className="input" />
          </label>
          <label>
            <span className="field-label">Harga beli (Rp)</span>
            <input name="purchase_price" inputMode="numeric" value={priceText} onChange={(e) => setPriceText(e.target.value)} required className="input" placeholder="25.000" />
          </label>
        </div>

        <p className="rounded-xl bg-crust px-4 py-3 text-center">
          <span className="text-sm text-muted">Harga per {effectiveBase}: </span>
          <b className="text-lg text-cocoa">{perBase == null ? "–" : formatRupiah(perBase, 2)}</b>
        </p>

        {initial && impact.length > 0 && (
          <div className={`card ${newlyOver.length ? "border-bad/40" : ""}`}>
            {newlyOver.length > 0 ? (
              <p className="mb-2 font-bold text-bad">⚠ Kalau disimpan, {newlyOver.length} produk jadi di atas target HPP:</p>
            ) : (
              <p className="mb-2 font-semibold text-muted">Produk yang terpengaruh:</p>
            )}
            <ul className="flex flex-col gap-1 text-sm">
              {impact.map((r) => (
                <li key={`${r.kind}-${r.id}`} className="flex justify-between gap-2">
                  <span className={r.newlyOver ? "font-semibold text-bad" : ""}>{r.name}</span>
                  <span className="tabular-nums">
                    {formatPercent(r.hppBefore)} → <b className={r.newlyOver ? "text-bad" : ""}>{formatPercent(r.hppAfter)}</b>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label>
          <span className="field-label">Supplier (opsional)</span>
          <input name="supplier" defaultValue={initial?.supplier ?? ""} className="input" />
        </label>
        <label>
          <span className="field-label">Catatan (opsional)</span>
          <textarea name="notes" defaultValue={initial?.notes ?? ""} rows={2} className="input py-2" />
        </label>
      </fieldset>

      <ErrorBox message={state.error} />
      {canEdit && <SubmitButton>Simpan</SubmitButton>}
      {initial && canDelete && (
        <ConfirmActionButton
          action={deleteIngredient.bind(null, initial.id)}
          confirmText={`Hapus "${initial.name}"?`}
          label="Hapus bahan"
          pendingLabel="Menghapus…"
          className="btn-danger w-full"
        />
      )}
    </form>
  );
}
