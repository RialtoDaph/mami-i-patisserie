"use client";

import { useActionState, useState } from "react";
import { saveStock } from "@/lib/kitchenActions";
import { formatDateId, todayJakarta, type StockState } from "@/lib/preorder";
import type { IngredientCategory } from "@/lib/costing";
import type { ActionResult } from "@/lib/actions";
import { Icon } from "@/components/brand";

export interface StockRowView {
  id: string;
  name: string;
  category: IngredientCategory;
  supplier: string | null;
  unitLabel: string;
  packSize: number;
  /** In purchase units, Indonesian format ("" = not set). */
  stock: string;
  min: string;
  state: StockState;
  countedAt: string | null;
  isDummy: boolean;
}

const STATE: Record<StockState, { label: string; cls: string }> = {
  kurang: { label: "Di bawah minimum", cls: "bg-brand-wine text-brand-butter" },
  belum_dihitung: { label: "Belum dihitung", cls: "bg-brand-wine-50 text-brand-wine" },
  cukup: { label: "Cukup", cls: "bg-brand-pistachio text-brand-espresso" },
  tanpa_minimum: { label: "Tanpa minimum", cls: "bg-brand-espresso/8 text-brand-muted" },
};

const inputClass = "block min-h-12 w-full min-w-0 rounded-md border-[1.5px] border-brand-espresso/18 bg-white px-3 text-base tabular-nums outline-none focus:border-brand-wine";

/** One ingredient: state chip, last count date, and a small form for the count and the minimum. */
export function StockRow({ row, first, canEdit, today }: { row: StockRowView; first: boolean; canEdit: boolean; today: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionResult & { savedAt?: number }, FormData>(async (prev, fd) => {
    const res = await saveStock(prev, fd);
    if (!res.error) setOpen(false);
    return res;
  }, {});
  const counted = row.countedAt ? todayJakarta(new Date(row.countedAt)) : null;
  const s = STATE[row.state];

  return (
    <div className={first ? "" : "border-t border-brand-espresso/10"}>
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left enabled:hover:bg-brand-butter"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">
            {row.name}
            {row.isDummy && <span className="ml-1.5 text-[11px] font-bold text-brand-muted">DUMMY</span>}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-brand-muted">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${s.cls}`}>{s.label}</span>
            <span>
              {row.stock ? `${row.stock} ${row.unitLabel}` : "Stok belum diisi"}
              {row.min && ` · min ${row.min}`}
              {counted && ` · dihitung ${counted === today ? "hari ini" : formatDateId(counted, false)}`}
            </span>
          </span>
        </span>
        {canEdit && <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={22} className="text-brand-muted" />}
      </button>
      {open && (
        <form action={action} className="grid gap-3 border-t border-dashed border-brand-espresso/20 px-4 pt-3 pb-4 nav:grid-cols-[1fr_1fr_auto] nav:items-end">
          <input type="hidden" name="id" value={row.id} />
          <input type="hidden" name="pack_size" value={row.packSize} />
          <input type="hidden" name="prev_stock" value={row.stock} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-brand-pistachio-deep">Stok sekarang ({row.unitLabel})</span>
            <input name="stock" defaultValue={row.stock} inputMode="decimal" autoComplete="off" placeholder="mis. 2,5" className={inputClass} autoFocus />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-brand-pistachio-deep">Minimum ({row.unitLabel})</span>
            <input name="min" defaultValue={row.min} inputMode="decimal" autoComplete="off" placeholder="kosong = tanpa minimum" className={inputClass} />
          </label>
          <button type="submit" disabled={pending} className="min-h-12 rounded-md bg-brand-wine px-5 text-[15px] font-bold text-brand-butter disabled:opacity-60">
            {pending ? "Menyimpan…" : "Simpan"}
          </button>
          {state.error && <p role="alert" className="text-sm font-semibold text-brand-wine nav:col-span-3">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
