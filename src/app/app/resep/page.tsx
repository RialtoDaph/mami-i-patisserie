import Link from "next/link";
import type { Metadata } from "next";
import { buildSummary, computeAllRecipeCosts, type RecipeCategory } from "@/lib/costing";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { formatRupiah } from "@/lib/format";
import { RECIPE_CATEGORY_LABEL } from "@/lib/labels";
import { DummyTag, EmptyState, HppBadge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Resep" };

const ORDER: RecipeCategory[] = ["mamis", "pastry_supplier", "minuman", "sub_resep"];

export default async function RecipesPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const summary = new Map(
    buildSummary(data, { roundingStep: 1000, includePbjt: false, includeInactive: true })
      .filter((r) => r.kind === "recipe")
      .map((r) => [r.id, r]),
  );
  let costs = new Map<string, { costPerUnit: number }>();
  try {
    costs = computeAllRecipeCosts(data.ingredients, data.recipes);
  } catch {
    // A broken recipe shows its error on the detail page; keep the list usable.
  }

  return (
    <>
      <PageHeader
        title="Resep"
        action={can(user.role, "recipe.edit") ? <Link href="/app/resep/baru" className="btn-primary px-4">+ Resep</Link> : null}
      />
      {data.recipes.length === 0 && <EmptyState>Belum ada resep. Tekan “+ Resep”.</EmptyState>}
      {ORDER.map((cat) => {
        const list = data.recipes.filter((r) => r.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} className="mb-6">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{RECIPE_CATEGORY_LABEL[cat]}</h2>
            <ul className="flex flex-col gap-2">
              {list.map((r) => {
                const s = summary.get(r.id);
                const cost = s?.cost ?? costs.get(r.id)?.costPerUnit ?? null;
                return (
                  <li key={r.id}>
                    <Link href={`/app/resep/${r.id}`} className={`card flex items-center justify-between gap-3 ${r.isActive ? "" : "opacity-60"}`}>
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">
                          {r.name}
                          <DummyTag show={r.isDummy} />
                          {!r.isActive && <span className="ml-1 text-xs text-muted">(nonaktif)</span>}
                        </p>
                        <p className="text-xs text-muted">
                          Biaya {formatRupiah(cost, r.yieldUnit === "g" || r.yieldUnit === "ml" ? 2 : 0)} / {r.yieldUnit}
                          {r.sellingPrice != null && ` · Jual ${formatRupiah(r.sellingPrice)}`}
                        </p>
                      </div>
                      {s && <HppBadge hpp={s.hppPct} status={s.status} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}
