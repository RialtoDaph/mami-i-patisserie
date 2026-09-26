"use client";

import { unitsFor, type BaseUnit, type ItemUnit, type YieldUnit } from "@/lib/costing";
import { formatRupiah } from "@/lib/format";

export interface ItemRow {
  key: string;
  /** "i:<ingredientId>" | "r:<recipeId>" | "" (not chosen yet) */
  ref: string;
  qty: string;
  unit: ItemUnit;
}

export interface OptionGroup {
  label: string;
  options: { ref: string; name: string; unit: BaseUnit | YieldUnit }[];
}

let counter = 0;
export const newRowKey = () => `row-${Date.now()}-${counter++}`;

export function ItemsEditor({
  rows,
  groups,
  lineCosts,
  onChange,
  addLabel,
  disabled,
}: {
  rows: ItemRow[];
  groups: OptionGroup[];
  lineCosts: (number | null)[];
  onChange: (rows: ItemRow[]) => void;
  addLabel: string;
  disabled?: boolean;
}) {
  const unitOf = new Map(groups.flatMap((g) => g.options.map((o) => [o.ref, o.unit] as const)));

  const update = (i: number, patch: Partial<ItemRow>) => {
    const next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => {
        const target = unitOf.get(row.ref);
        const units = target ? unitsFor(target) : [];
        return (
          <div key={row.key} className="card flex flex-col gap-2 p-3">
            <div className="flex gap-2">
              <select
                aria-label="Pilih bahan"
                value={row.ref}
                disabled={disabled}
                onChange={(e) => {
                  const ref = e.target.value;
                  const t = unitOf.get(ref);
                  const unit = t && unitsFor(t).includes(row.unit) ? row.unit : ((t ?? "g") as ItemUnit);
                  update(i, { ref, unit });
                }}
                className="input flex-1"
              >
                <option value="">— Pilih —</option>
                {groups.map((g) =>
                  g.options.length ? (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((o) => (
                        <option key={o.ref} value={o.ref}>{o.name}</option>
                      ))}
                    </optgroup>
                  ) : null,
                )}
              </select>
              {!disabled && (
                <button
                  type="button"
                  aria-label="Hapus baris"
                  onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-black/10 text-xl text-bad"
                >
                  ×
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                aria-label="Jumlah"
                inputMode="decimal"
                value={row.qty}
                disabled={disabled}
                onChange={(e) => update(i, { qty: e.target.value })}
                className="input w-28"
                placeholder="Jumlah"
              />
              <select
                aria-label="Satuan"
                value={row.unit}
                disabled={disabled || units.length <= 1}
                onChange={(e) => update(i, { unit: e.target.value as ItemUnit })}
                className="input w-24"
              >
                {(units.length ? units : [row.unit]).map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <span className="ml-auto text-right font-semibold tabular-nums text-cocoa">
                {lineCosts[i] == null ? "–" : formatRupiah(lineCosts[i])}
              </span>
            </div>
          </div>
        );
      })}
      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...rows, { key: newRowKey(), ref: "", qty: "", unit: "g" }])}
          className="btn-secondary w-full border-dashed"
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}

export function rowsFromItems(items: { source: { kind: "ingredient" | "recipe"; id: string }; quantity: number; unit: ItemUnit }[]): ItemRow[] {
  return items.map((it) => ({
    key: newRowKey(),
    ref: `${it.source.kind === "ingredient" ? "i" : "r"}:${it.source.id}`,
    qty: String(it.quantity).replace(".", ","),
    unit: it.unit,
  }));
}

/** Parses editor rows; rows without a selection or quantity yield null quantity. */
export function parseRow(row: ItemRow, parse: (s: string) => number | null) {
  const [prefix, id] = row.ref.split(":");
  return {
    kind: (prefix === "r" ? "recipe" : "ingredient") as "recipe" | "ingredient",
    id: id ?? "",
    quantity: parse(row.qty),
    unit: row.unit,
  };
}
