import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  computeRecipeCost, createContext, grossMargin, hppPct, hppStatus, suggestedPrice, withPbjt,
} from "@/lib/costing";
import { deleteRecipe, duplicateRecipe } from "@/lib/actions";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { formatNumber, formatRupiah } from "@/lib/format";
import { RECIPE_CATEGORY_LABEL } from "@/lib/labels";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { DummyTag, HppBadge, PageHeader, Row } from "@/components/ui";

export const metadata: Metadata = { title: "Resep" };

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const recipe = data.recipes.find((r) => r.id === id);
  if (!recipe) notFound();

  const ctx = createContext(data.ingredients, data.recipes);
  let cost: ReturnType<typeof computeRecipeCost> | null = null;
  let error: string | null = null;
  try {
    cost = computeRecipeCost(ctx, id);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const fine = recipe.yieldUnit === "g" || recipe.yieldUnit === "ml" ? 2 : 0;
  const hpp = cost ? hppPct(cost.costPerUnit, recipe.sellingPrice) : null;
  const status = hppStatus(hpp, recipe.targetHppPct);
  const hrefFor = (kind: "ingredient" | "recipe", sid: string) => (kind === "ingredient" ? `/app/bahan/${sid}` : `/app/resep/${sid}`);

  const usedIn = [
    ...data.recipes.filter((r) => r.items.some((it) => it.source.kind === "recipe" && it.source.id === id)).map((r) => ({ href: `/app/resep/${r.id}`, name: r.name })),
    ...data.bundles.filter((b) => b.items.some((it) => it.source.kind === "recipe" && it.source.id === id)).map((b) => ({ href: `/app/paket/${b.id}`, name: b.name })),
  ];

  return (
    <>
      <PageHeader title={recipe.name} back="/app/resep" />
      <p className="-mt-3 mb-4 text-sm text-muted">
        {RECIPE_CATEGORY_LABEL[recipe.category]} · hasil {formatNumber(recipe.yieldQty, 3)} {recipe.yieldUnit} · susut {formatNumber(recipe.wastePct, 2)}%
        {!recipe.isActive && " · nonaktif"}
        <DummyTag show={recipe.isDummy} />
      </p>

      <section className="card mb-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Biaya per {recipe.yieldUnit}</p>
            <p className="text-3xl font-bold text-cocoa tabular-nums">{formatRupiah(cost?.costPerUnit ?? null, fine)}</p>
          </div>
          {recipe.category !== "sub_resep" && <HppBadge hpp={hpp} status={status} size="lg" />}
        </div>
        {error && <p className="text-sm font-semibold text-bad">⚠ {error}</p>}
        {cost && (
          <>
            <Row label="Biaya per batch" value={formatRupiah(cost.batchCost)} />
            <Row label="Hasil setelah susut" value={`${formatNumber(cost.sellableQty, 2)} ${recipe.yieldUnit}`} />
            {recipe.category !== "sub_resep" && (
              <>
                <Row label="Harga jual" value={formatRupiah(recipe.sellingPrice)} />
                <Row label="Harga jual + PBJT 10%" value={recipe.sellingPrice == null ? "–" : formatRupiah(withPbjt(recipe.sellingPrice))} />
                <Row label="Margin kotor" value={formatRupiah(grossMargin(cost.costPerUnit, recipe.sellingPrice))} />
                <Row label="Target HPP" value={`${formatNumber(recipe.targetHppPct, 2)}%`} />
                <Row label="Saran harga (Rp 500)" value={formatRupiah(suggestedPrice(cost.costPerUnit, recipe.targetHppPct, 500))} />
                <Row label="Saran harga (Rp 1.000)" value={formatRupiah(suggestedPrice(cost.costPerUnit, recipe.targetHppPct, 1000))} />
              </>
            )}
          </>
        )}
      </section>

      <section className="mb-4">
        <h2 className="mb-2 font-bold text-cocoa">Komposisi per batch</h2>
        <ul className="card flex flex-col divide-y divide-black/5 p-0">
          {recipe.items.length === 0 && <li className="px-4 py-3 text-muted">Belum ada bahan.</li>}
          {recipe.items.map((it, i) => {
            const line = cost?.lines[i];
            return (
              <li key={i}>
                <Link href={hrefFor(it.source.kind, it.source.id)} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    {line?.name ?? "?"}
                    <span className="block text-xs text-muted">
                      {formatNumber(it.quantity, 3)} {it.unit}
                      {it.source.kind === "recipe" && " · sub-resep"}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatRupiah(line?.cost ?? null)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {recipe.notes && (
        <section className="mb-4">
          <h2 className="mb-2 font-bold text-cocoa">Catatan</h2>
          <p className="card whitespace-pre-wrap">{recipe.notes}</p>
        </section>
      )}

      {usedIn.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-2 font-bold text-cocoa">Dipakai di</h2>
          <ul className="card flex flex-col divide-y divide-black/5 p-0">
            {usedIn.map((u) => (
              <li key={u.href}><Link href={u.href} className="block px-4 py-3">{u.name}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {can(user.role, "recipe.edit") && (
        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/app/resep/${id}/ubah`} className="btn-primary w-full">Ubah resep</Link>
          <ConfirmActionButton
            action={duplicateRecipe.bind(null, id)}
            label="Duplikat (buat variasi)"
            pendingLabel="Menduplikat…"
            className="btn-secondary w-full"
          />
          {can(user.role, "recipe.delete") && (
            <ConfirmActionButton
              action={deleteRecipe.bind(null, id)}
              confirmText={`Hapus resep "${recipe.name}"?`}
              label="Hapus resep"
              pendingLabel="Menghapus…"
              className="btn-danger w-full"
            />
          )}
        </div>
      )}
    </>
  );
}
