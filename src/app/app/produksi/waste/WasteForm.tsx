"use client";

import { useActionState, useState, useTransition } from "react";
import { addWaste, deleteWaste } from "@/lib/kitchenActions";
import { WASTE_REASON_LABEL, type WasteReason } from "@/lib/preorder";
import type { ActionResult } from "@/lib/actions";
import { Icon } from "@/components/brand";
import { Panel, PanelTitle } from "@/components/app/ui";

export interface WasteOption {
  value: string;
  label: string;
  group: "Produk" | "Bahan";
  unit: string;
  packSize: number;
}

const inputClass = "block min-h-12 w-full min-w-0 rounded-md border-[1.5px] border-brand-espresso/18 bg-white px-3 text-base outline-none focus:border-brand-wine";

/** "Catat waste" in three taps: what, how many, why. */
export function WasteForm({ options, today }: { options: WasteOption[]; today: string }) {
  const [item, setItem] = useState("");
  const [reason, setReason] = useState<WasteReason>("tidak_laku");
  const [formKey, setFormKey] = useState(0);
  const [state, action, pending] = useActionState<ActionResult & { savedAt?: number }, FormData>(async (prev, fd) => {
    const res = await addWaste(prev, fd);
    if (!res.error) {
      setItem("");
      setFormKey((k) => k + 1);
    }
    return res;
  }, {});
  const picked = options.find((o) => o.value === item);

  return (
    <Panel>
      <form key={formKey} action={action} className="flex flex-col gap-3">
        <PanelTitle>Catat waste</PanelTitle>
        {picked && <input type="hidden" name={`pack_${picked.value.slice(2)}`} value={picked.packSize} />}
        <div className="grid gap-3 nav:grid-cols-[2fr_1fr_1fr]">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-brand-pistachio-deep">Apa yang terbuang</span>
            <select name="item" value={item} onChange={(e) => setItem(e.target.value)} required className={`${inputClass} appearance-auto`}>
              <option value="">Pilih…</option>
              {(["Produk", "Bahan"] as const).map((g) => (
                <optgroup key={g} label={g}>
                  {options.filter((o) => o.group === g).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-brand-pistachio-deep">Jumlah{picked ? ` (${picked.unit})` : ""}</span>
            <input name="qty" inputMode="decimal" required autoComplete="off" placeholder="mis. 3" className={`${inputClass} tabular-nums`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-brand-pistachio-deep">Tanggal</span>
            <input type="date" name="date" defaultValue={today} max={today} required className={inputClass} />
          </label>
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-bold text-brand-pistachio-deep">Alasan</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(WASTE_REASON_LABEL) as WasteReason[]).map((r) => (
              <label key={r} className={`inline-flex min-h-10 cursor-pointer items-center rounded-md border-[1.5px] px-3.5 text-sm font-bold ${reason === r ? "border-brand-espresso bg-brand-espresso text-brand-butter" : "border-brand-espresso/22 bg-white"}`}>
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="sr-only" />
                {WASTE_REASON_LABEL[r]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-brand-pistachio-deep">Catatan <span className="font-normal text-brand-muted">(opsional)</span></span>
          <input name="note" maxLength={300} placeholder="mis. croissant sisa etalase" className={inputClass} />
        </label>
        {state.error && <p role="alert" className="text-sm font-semibold text-brand-wine">{state.error}</p>}
        {state.savedAt && !state.error && (
          <p role="status" className="rounded-md border-[1.5px] border-brand-pistachio bg-brand-pistachio-50 px-3 py-2 text-sm font-bold">Tercatat</p>
        )}
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-md bg-brand-wine px-5 text-[15px] font-bold text-brand-butter disabled:opacity-60">
          <Icon name="add" size={20} />
          {pending ? "Menyimpan…" : "Catat"}
        </button>
      </form>
    </Panel>
  );
}

export function DeleteWasteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Hapus"
      onClick={() => {
        if (!confirm("Hapus catatan waste ini?")) return;
        start(async () => {
          const res = await deleteWaste(id);
          if (res.error) alert(res.error);
        });
      }}
      className="flex size-11 items-center justify-center rounded-md text-brand-muted hover:text-brand-wine disabled:opacity-50"
    >
      <Icon name="delete" size={20} />
    </button>
  );
}
