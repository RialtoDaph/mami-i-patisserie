"use client";

import { useActionState, useState, useTransition } from "react";
import { resetYearTargets, saveMonthTargets, saveYearTargets, type SavedResult } from "@/lib/planActions";
import type { MonthTargets } from "@/lib/plans";
import { Icon } from "@/components/brand";
import { Panel } from "@/components/app/ui";
import { AppField, FormMessage, NumberInput } from "@/components/app/form";

const editButton = "inline-flex min-h-11 items-center gap-1.5 self-start rounded-md border-[1.5px] border-brand-espresso/22 bg-white px-4 text-[15px] font-bold";
const saveButton = "inline-flex min-h-12 items-center justify-center rounded-md bg-brand-wine px-5 text-[15px] font-bold text-brand-butter disabled:opacity-60";

function useSaved(action: (prev: SavedResult, fd: FormData) => Promise<SavedResult>, close: () => void) {
  return useActionState<SavedResult, FormData>(async (prev, fd) => {
    const res = await action(prev, fd);
    if (!res.error) close();
    return res;
  }, {});
}

const MONTH_FIELDS: { k: keyof MonthTargets; label: string; max?: number }[] = [
  { k: "cafe", label: "Omzet kafe (Rp)" },
  { k: "preorder", label: "Pre-order pastry & frozen (Rp)" },
  { k: "hampers", label: "Hampers (Rp)" },
  { k: "web", label: "Dari website (Rp)" },
  { k: "orders", label: "Jumlah order" },
  { k: "avgOrder", label: "Rata-rata nilai order (Rp)" },
  { k: "foodCost", label: "Food cost maks (%)", max: 100 },
];

export function MonthTargetForm({ month, values }: { month: string; values: MonthTargets }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useSaved(saveMonthTargets, () => setOpen(false));
  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <FormMessage ok={state.savedAt ? state.message : null} />
        <button type="button" onClick={() => setOpen(true)} className={editButton}>
          <Icon name="edit" size={18} />
          Ubah target
        </button>
      </div>
    );
  }
  return (
    <Panel className="p-[18px]">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="month" value={month} />
        <div className="grid gap-3 nav:grid-cols-2 wide:grid-cols-4">
          {MONTH_FIELDS.map((f) => (
            <AppField key={f.k} label={f.label}>
              <NumberInput name={f.k} defaultValue={values[f.k] == null ? null : Math.round(values[f.k]!)} max={f.max} />
            </AppField>
          ))}
        </div>
        <p className="text-[13px] text-brand-muted">Kosongkan kalau tidak ada target. Bulan-bulan berikutnya ikut angka ini sampai diubah lagi.</p>
        <FormMessage error={state.error} />
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={saveButton}>{pending ? "Menyimpan…" : "Simpan target"}</button>
          <button type="button" onClick={() => setOpen(false)} className="min-h-12 px-4 font-bold text-brand-muted">Batal</button>
        </div>
      </form>
    </Panel>
  );
}

export function YearTargetForm({ year, revenue, orders }: { year: number; revenue: number | null; orders: number | null }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useSaved(saveYearTargets, () => setOpen(false));
  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <FormMessage ok={state.savedAt ? state.message : null} />
        <button type="button" onClick={() => setOpen(true)} className={editButton}>
          <Icon name="edit" size={18} />
          Ubah target tahunan
        </button>
      </div>
    );
  }
  return (
    <Panel className="max-w-[640px] p-[18px]">
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="year" value={year} />
        <div className="grid gap-3 nav:grid-cols-2">
          <AppField label="Omzet total setahun (Rp)">
            <NumberInput name="revenue" defaultValue={revenue} />
          </AppField>
          <AppField label="Jumlah order setahun">
            <NumberInput name="orders" defaultValue={orders} />
          </AppField>
        </div>
        <FormMessage error={state.error} />
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className={saveButton}>{pending ? "Menyimpan…" : "Simpan target"}</button>
          <button type="button" onClick={() => setOpen(false)} className="min-h-12 px-4 font-bold text-brand-muted">Batal</button>
        </div>
      </form>
    </Panel>
  );
}

export function ResetYearButton({ year }: { year: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setError((await resetYearTargets(year)).error ?? ""))}
        className="btn-secondary self-start"
      >
        Pakai jumlah bulanan
      </button>
      {error && <p role="alert" className="text-sm font-semibold text-brand-wine">{error}</p>}
    </div>
  );
}
