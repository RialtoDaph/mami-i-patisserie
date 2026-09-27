"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BaseUnit, IngredientCategory, PurchaseUnit } from "@/lib/costing";
import { formatNumber, formatRupiah } from "@/lib/format";
import { purchaseDescription } from "@/lib/unitLabels";
import { DummyTag, EmptyState } from "@/components/ui";

export interface IngredientListItem {
  id: string;
  name: string;
  category: IngredientCategory;
  supplier: string | null;
  purchaseUnit: PurchaseUnit;
  purchaseQty: number;
  purchasePrice: number;
  baseUnit: BaseUnit;
  pricePerBase: number;
  isDummy: boolean;
}

export function IngredientList({ items }: { items: IngredientListItem[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<IngredientCategory | "semua">("semua");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (cat === "semua" || i.category === cat) &&
        (!needle || i.name.toLowerCase().includes(needle) || i.supplier?.toLowerCase().includes(needle)),
    );
  }, [items, q, cat]);

  return (
    <>
      <input
        type="search"
        placeholder="Cari bahan atau supplier…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="input mb-3"
      />
      <div className="mb-4 flex gap-2">
        {(["semua", "bahan", "kemasan"] as const).map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)} className={cat === c ? "chip-on" : "chip-off"}>
            {c === "semua" ? "Semua" : c === "bahan" ? "Bahan" : "Kemasan"}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState>{items.length ? "Tidak ada yang cocok." : "Belum ada bahan. Tekan “+ Tambah”."}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((i) => (
            <li key={i.id}>
              <Link href={`/app/bahan/${i.id}`} className="card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">
                    {i.name}
                    <DummyTag show={i.isDummy} />
                  </p>
                  <p className="truncate text-xs text-muted">
                    {formatRupiah(i.purchasePrice)} / {purchaseDescription(i.purchaseUnit, i.purchaseQty, i.baseUnit, (n) => formatNumber(n, 3))}
                    {i.supplier && ` · ${i.supplier}`}
                  </p>
                </div>
                <p className="shrink-0 text-right font-bold tabular-nums text-cocoa">
                  {formatRupiah(i.pricePerBase, 2)}
                  <span className="block text-xs font-normal text-muted">per {i.baseUnit}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
