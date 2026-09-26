import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, loadCostingData, loadPriceHistory } from "@/lib/data";
import { can } from "@/lib/permissions";
import { formatRupiah } from "@/lib/format";
import { DummyTag, PageHeader } from "@/components/ui";
import { IngredientForm } from "../IngredientForm";

export const metadata: Metadata = { title: "Ubah bahan" };

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data, history] = await Promise.all([getCurrentUser(), loadCostingData(), loadPriceHistory(id)]);
  const ing = data.ingredients.find((i) => i.id === id);
  if (!ing) notFound();

  const usedIn = [
    ...data.recipes
      .filter((r) => r.items.some((it) => it.source.kind === "ingredient" && it.source.id === id))
      .map((r) => ({ href: `/app/resep/${r.id}`, name: r.name })),
    ...data.bundles
      .filter((b) => b.items.some((it) => it.source.kind === "ingredient" && it.source.id === id))
      .map((b) => ({ href: `/app/paket/${b.id}`, name: b.name })),
  ];

  return (
    <>
      <PageHeader title="Ubah bahan" back="/app/bahan" />
      {ing.isDummy && <p className="mb-3 text-sm text-muted">Ini data contoh <DummyTag show /></p>}
      <IngredientForm
        initial={ing}
        data={data}
        canEdit={can(user.role, "ingredient.edit")}
        canDelete={can(user.role, "ingredient.delete") && usedIn.length === 0}
      />

      <section className="mt-8">
        <h2 className="mb-2 font-bold text-cocoa">Dipakai di</h2>
        {usedIn.length === 0 ? (
          <p className="text-sm text-muted">Belum dipakai di resep atau paket.</p>
        ) : (
          <ul className="card flex flex-col divide-y divide-black/5 p-0">
            {usedIn.map((u) => (
              <li key={u.href}>
                <Link href={u.href} className="block px-4 py-3">{u.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-2 font-bold text-cocoa">Riwayat harga</h2>
        <ul className="card flex flex-col divide-y divide-black/5 p-0 text-sm">
          {history.map((h) => (
            <li key={h.id} className="flex justify-between gap-3 px-4 py-3">
              <span className="text-muted">{dateFmt(h.changedAt)}</span>
              <span className="tabular-nums">
                {h.oldPurchasePrice == null ? "Harga awal " : `${formatRupiah(h.oldPurchasePrice)} → `}
                <b>{formatRupiah(h.newPurchasePrice)}</b>
                <span className="block text-right text-xs text-muted">{formatRupiah(h.newPricePerBaseUnit, 2)} / {ing.baseUnit}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
