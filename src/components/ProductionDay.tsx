import { formatNumber } from "@/lib/format";
import { formatDateId, needLabel, type ScheduleDay } from "@/lib/preorder";
import type { BaseUnit } from "@/lib/costing";

export interface DayIngredient {
  id: string;
  name: string;
  qty: number;
  unit: BaseUnit;
}

const batchLabel = (b: number) => `${formatNumber(b, b < 1 ? 1 : b % 1 ? 1 : 0)} adonan`;

/** One day of the production schedule: products to make, then (folded) recipe batches and ingredient needs. */
export function ProductionDay({ day, today, ingredients }: { day: ScheduleDay; today: string; ingredients: DayIngredient[] }) {
  const isToday = day.date === today;
  return (
    <section
      className={`flex flex-col gap-1 rounded-md bg-brand-butter-50 px-4 pt-3 pb-1 ${
        isToday ? "border-2 border-brand-wine" : "border-[1.5px] border-brand-espresso/18"
      }`}
    >
      <h3 className="flex items-baseline justify-between gap-2">
        <span className="font-display text-[17px] font-bold">
          {formatDateId(day.date, false).replace(/ \d{4}$/, "")}
          {isToday && <span className="ml-1.5 font-sans text-xs tracking-wider text-brand-wine">HARI INI</span>}
        </span>
        <span className="text-[13px] text-brand-muted">{day.orderCount} order</span>
      </h3>
      <ul className="flex flex-col">
        {day.products.map((p) => (
          <li key={p.productId} className="flex items-baseline justify-between gap-3 border-t border-brand-espresso/8 py-1.5 text-[15px]">
            <span>{p.name}</span>
            <b className="font-display text-xl tabular-nums">{p.qty}</b>
          </li>
        ))}
      </ul>
      {day.recipes.length > 0 && (
        <details className="group border-t border-brand-espresso/12">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-bold tracking-[.14em] text-brand-pistachio-deep uppercase">
            Kebutuhan resep
            <span className="text-base transition group-open:rotate-180">⌄</span>
          </summary>
          <ul className="flex flex-col gap-1 pb-3 text-[13px]">
            {day.recipes.map((r) => (
              <li key={r.recipeId} className="flex justify-between gap-2 text-brand-wine">
                <span>
                  {r.isSubRecipe ? "↳ " : ""}
                  {r.name} · {formatNumber(r.qty, r.unit === "g" || r.unit === "ml" ? 0 : 1)} {r.unit}
                </span>
                <span className="shrink-0 tabular-nums">{batchLabel(r.batches)}</span>
              </li>
            ))}
            {ingredients.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span>{i.name}</span>
                <span className="shrink-0 tabular-nums">{needLabel(i.qty, i.unit)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
