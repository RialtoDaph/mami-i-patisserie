"use client";

import { useState, useTransition } from "react";
import { deleteCampaign, saveCampaign } from "@/lib/preorderActions";
import { formatNumber, formatRupiah, parseNumberInput } from "@/lib/format";
import type { Campaign, Product } from "@/lib/preorder";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { ErrorBox } from "@/components/ui";

export function CampaignForm({
  initial,
  products,
  defaultDpPercent,
  canEdit,
}: {
  initial: Campaign & { notes: string | null } | null;
  products: Product[];
  defaultDpPercent: number;
  canEdit: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(initial?.preorderOpen ?? "");
  const [close, setClose] = useState(initial?.preorderClose ?? "");
  const [fStart, setFStart] = useState(initial?.fulfillStart ?? "");
  const [fEnd, setFEnd] = useState(initial?.fulfillEnd ?? "");
  const [dp, setDp] = useState(initial?.dpPercent != null ? formatNumber(initial.dpPercent, 2) : "");
  const [active, setActive] = useState(initial?.isActive ?? true);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [selected, setSelected] = useState<Record<string, string | null>>(
    Object.fromEntries((initial?.products ?? []).map((p) => [p.productId, p.priceOverride != null ? formatNumber(p.priceOverride) : ""])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    start(async () => {
      const res = await saveCampaign({
        id: initial?.id ?? null,
        name,
        preorderOpen: open,
        preorderClose: close,
        fulfillStart: fStart,
        fulfillEnd: fEnd,
        dpPercent: dp.trim() ? parseNumberInput(dp) : null,
        isActive: active,
        notes,
        products: Object.entries(selected)
          .filter(([, v]) => v !== null)
          .map(([productId, v]) => ({ productId, priceOverride: v && v.trim() ? parseNumberInput(v) : null })),
      });
      if (res?.error) setError(res.error);
    });
  };

  const date = (label: string, value: string, set: (v: string) => void) => (
    <label><span className="field-label">{label}</span><input type="date" value={value} onChange={(e) => set(e.target.value)} className="input" /></label>
  );

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <fieldset disabled={!canEdit} className="flex flex-col gap-4">
        <label><span className="field-label">Nama campaign</span><input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="mis. Lebaran 2027" /></label>
        <div className="grid grid-cols-2 gap-3">
          {date("Preorder dibuka", open, setOpen)}
          {date("Preorder ditutup", close, setClose)}
          {date("Ambil/kirim mulai", fStart, setFStart)}
          {date("Ambil/kirim sampai", fEnd, setFEnd)}
        </div>
        <label>
          <span className="field-label">DP (%)</span>
          <input value={dp} onChange={(e) => setDp(e.target.value)} inputMode="decimal" className="input" placeholder={`kosong = default ${formatNumber(defaultDpPercent, 2)}%`} />
        </label>

        <section>
          <h2 className="mb-2 font-bold text-cocoa">Produk dalam campaign</h2>
          <ul className="flex flex-col gap-2">
            {products.map((p) => {
              const on = p.id in selected && selected[p.id] !== null;
              return (
                <li key={p.id} className={`card flex flex-col gap-2 p-3 ${on ? "border-cocoa/40" : ""}`}>
                  <label className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked ? "" : null }))}
                      className="size-6 accent-cocoa"
                    />
                    <span className="flex-1 font-semibold">{p.name}</span>
                    <span className="text-sm text-muted">{formatRupiah(p.price)}</span>
                  </label>
                  {on && (
                    <input
                      value={selected[p.id] ?? ""}
                      onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.value }))}
                      inputMode="numeric"
                      className="input"
                      placeholder="Harga khusus campaign (opsional)"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-6 accent-cocoa" />
          <span className="font-semibold">Aktif</span>
        </label>
        <label><span className="field-label">Catatan</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input py-2" /></label>
      </fieldset>
      <ErrorBox message={error} />
      {canEdit && <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? "Menyimpan…" : "Simpan campaign"}</button>}
      {canEdit && initial && (
        <ConfirmActionButton
          action={deleteCampaign.bind(null, initial.id)}
          confirmText={`Hapus campaign "${initial.name}"? (Tidak bisa kalau sudah ada order.)`}
          label="Hapus campaign"
          pendingLabel="Menghapus…"
          className="btn-danger w-full"
        />
      )}
    </form>
  );
}
