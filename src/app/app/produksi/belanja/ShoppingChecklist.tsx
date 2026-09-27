"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { buyLabel, CATEGORY_TITLE, needLabel, shoppingMessage, type ShoppingGroup } from "@/lib/preorder";

/** Checklist of what to buy. "Sudah dibeli" ticks are kept per device in localStorage. */
export function ShoppingChecklist({
  groups, totalBuy, totalUse, storageKey, title, csvHref,
}: {
  groups: ShoppingGroup[];
  totalBuy: number;
  totalUse: number;
  storageKey: string;
  title: string;
  csvHref: string;
}) {
  const [bought, setBought] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once after mount (avoids hydration mismatch)
      setBought(new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : []));
    } catch {
      setBought(new Set());
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...bought]));
    } catch {
      // Storage full or blocked: the checklist still works for this visit.
    }
  }, [bought, loaded, storageKey]);

  const toggle = (id: string) =>
    setBought((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const all = groups.flatMap((g) => g.suppliers.flatMap((s) => s.rows));
  const remaining = all.filter((r) => !bought.has(r.ingredientId)).reduce((s, r) => s + r.buyCost, 0);
  const waHref = `https://wa.me/?text=${encodeURIComponent(shoppingMessage(groups, title, bought))}`;

  return (
    <>
      {groups.map((g) => (
        <section key={g.category} className="mb-4">
          <h2 className="mb-2 text-lg font-bold text-cocoa">{CATEGORY_TITLE[g.category]}</h2>
          {g.suppliers.map((s) => (
            <div key={s.supplier ?? "-"} className="card mb-2 p-0">
              <p className="border-b border-black/5 px-4 py-2 text-sm font-semibold text-muted">
                {s.supplier ?? "Supplier belum diisi"}
              </p>
              <ul className="divide-y divide-black/5">
                {s.rows.map((r) => {
                  const done = bought.has(r.ingredientId);
                  return (
                    <li key={r.ingredientId}>
                      <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggle(r.ingredientId)}
                          className="size-6 shrink-0 accent-brand-espresso"
                        />
                        <span className={`min-w-0 flex-1 ${done ? "text-muted line-through" : ""}`}>
                          <span className="block font-semibold">{r.name}</span>
                          <span className="block text-sm">
                            Beli <b>{buyLabel(r)}</b> <span className="text-muted">· butuh {needLabel(r.needQty, r.baseUnit)}</span>
                          </span>
                        </span>
                        <span className="shrink-0 text-right text-sm tabular-nums">{formatRupiah(r.buyCost)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}

      <section className="card mb-4">
        <div className="flex items-baseline justify-between gap-3 py-1">
          <span className="text-sm text-muted">Estimasi belanja</span>
          <b className="text-lg tabular-nums">{formatRupiah(totalBuy)}</b>
        </div>
        {bought.size > 0 && (
          <div className="flex items-baseline justify-between gap-3 py-1">
            <span className="text-sm text-muted">Belum dibeli</span>
            <b className="tabular-nums">{formatRupiah(remaining)}</b>
          </div>
        )}
        <p className="mt-1 text-xs text-muted">
          Harga dari data bahan (per kemasan beli). Nilai bahan yang benar-benar terpakai ± {formatRupiah(totalUse)}; sisanya jadi stok.
        </p>
      </section>

      <div className="mb-6 flex flex-col gap-2">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">Kirim daftar via WhatsApp</a>
        <a href={csvHref} className="btn-secondary w-full">Unduh CSV</a>
        {bought.size > 0 && (
          <button type="button" onClick={() => setBought(new Set())} className="min-h-11 text-sm font-semibold text-muted underline">
            Hapus semua centang
          </button>
        )}
      </div>
    </>
  );
}
