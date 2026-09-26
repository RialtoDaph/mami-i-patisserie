import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { computeBundleCost, createContext, grossMargin, hppPct, hppStatus, suggestedPrice, withPbjt } from "@/lib/costing";
import { deleteBundle } from "@/lib/actions";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { formatNumber, formatRupiah } from "@/lib/format";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { DummyTag, HppBadge, PageHeader, Row } from "@/components/ui";

export const metadata: Metadata = { title: "Paket" };

export default async function BundleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const bundle = data.bundles.find((b) => b.id === id);
  if (!bundle) notFound();

  let result: ReturnType<typeof computeBundleCost> | null = null;
  let error: string | null = null;
  try {
    result = computeBundleCost(createContext(data.ingredients, data.recipes), bundle);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  const hpp = result ? hppPct(result.cost, bundle.sellingPrice) : null;

  return (
    <>
      <PageHeader title={bundle.name} back="/app/paket" />
      <p className="-mt-3 mb-4 text-sm text-muted">
        Paket · {bundle.items.length} isi{!bundle.isActive && " · nonaktif"}
        <DummyTag show={bundle.isDummy} />
      </p>

      <section className="card mb-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Biaya paket</p>
            <p className="text-3xl font-bold text-cocoa tabular-nums">{formatRupiah(result?.cost ?? null)}</p>
          </div>
          <HppBadge hpp={hpp} status={hppStatus(hpp, bundle.targetHppPct)} size="lg" />
        </div>
        {error && <p className="text-sm font-semibold text-bad">⚠ {error}</p>}
        {result && (
          <>
            <Row label="Harga jual" value={formatRupiah(bundle.sellingPrice)} />
            <Row label="Harga jual + PBJT 10%" value={bundle.sellingPrice == null ? "–" : formatRupiah(withPbjt(bundle.sellingPrice))} />
            <Row label="Margin kotor" value={formatRupiah(grossMargin(result.cost, bundle.sellingPrice))} />
            <Row label="Target HPP" value={`${formatNumber(bundle.targetHppPct, 2)}%`} />
            <Row label="Saran harga (Rp 500)" value={formatRupiah(suggestedPrice(result.cost, bundle.targetHppPct, 500))} />
            <Row label="Saran harga (Rp 1.000)" value={formatRupiah(suggestedPrice(result.cost, bundle.targetHppPct, 1000))} />
          </>
        )}
      </section>

      <section className="mb-4">
        <h2 className="mb-2 font-bold text-cocoa">Isi paket</h2>
        <ul className="card flex flex-col divide-y divide-black/5 p-0">
          {bundle.items.map((it, i) => {
            const line = result?.lines[i];
            return (
              <li key={i}>
                <Link
                  href={it.source.kind === "recipe" ? `/app/resep/${it.source.id}` : `/app/bahan/${it.source.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span>
                    {line?.name ?? "?"}
                    <span className="block text-xs text-muted">{formatNumber(it.quantity, 3)} {it.unit}</span>
                  </span>
                  <span className="font-semibold tabular-nums">{formatRupiah(line?.cost ?? null)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {bundle.notes && <p className="card mb-4 whitespace-pre-wrap">{bundle.notes}</p>}

      {can(user.role, "bundle.edit") && (
        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/app/paket/${id}/ubah`} className="btn-primary w-full">Ubah paket</Link>
          <ConfirmActionButton
            action={deleteBundle.bind(null, id)}
            confirmText={`Hapus paket "${bundle.name}"?`}
            label="Hapus paket"
            pendingLabel="Menghapus…"
            className="btn-danger w-full"
          />
        </div>
      )}
    </>
  );
}
