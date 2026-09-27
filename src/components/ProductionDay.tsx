import { formatNumber } from "@/lib/format";
import { formatDateId, type ScheduleDay } from "@/lib/preorder";

/** One day of the production schedule: products to prepare and recipe quantities. */
export function ProductionDay({ day, today, showRecipes = true }: { day: ScheduleDay; today: string; showRecipes?: boolean }) {
  const isToday = day.date === today;
  if (day.products.length === 0) {
    return (
      <p className="flex justify-between rounded-xl px-4 py-2 text-sm text-muted">
        <span>{formatDateId(day.date)}{isToday && " · hari ini"}</span>
        <span>tidak ada order</span>
      </p>
    );
  }
  return (
    <section className={`card ${isToday ? "border-2 border-cocoa" : ""}`}>
      <h2 className="mb-2 flex items-baseline justify-between font-bold text-cocoa">
        <span>{formatDateId(day.date)}{isToday && " · HARI INI"}</span>
        <span className="text-sm font-normal text-muted">{day.orderCount} order</span>
      </h2>
      <ul className="flex flex-col gap-1">
        {day.products.map((p) => (
          <li key={p.productId} className="flex justify-between gap-2 text-lg">
            <span>{p.name}</span>
            <b className="tabular-nums">{p.qty}</b>
          </li>
        ))}
      </ul>
      {showRecipes && day.recipes.length > 0 && (
        <details className="mt-3 border-t border-black/5 pt-2">
          <summary className="cursor-pointer text-sm font-semibold text-muted">Kebutuhan resep</summary>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {day.recipes.map((r) => (
              <li key={r.recipeId} className="flex justify-between gap-2">
                <span className={r.isSubRecipe ? "pl-3 text-muted" : ""}>{r.isSubRecipe ? "↳ " : ""}{r.name}</span>
                <span className="tabular-nums">
                  {formatNumber(r.qty, r.unit === "g" || r.unit === "ml" ? 0 : 1)} {r.unit}
                  <span className="text-muted"> · {formatNumber(r.batches, 2)} batch</span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
