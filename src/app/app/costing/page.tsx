import Link from "next/link";
import type { Metadata } from "next";
import { CostingTabs } from "@/components/CostingTabs";
import { buildSummary } from "@/lib/costing";
import { loadCostingData } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { RECIPE_CATEGORY_LABEL } from "@/lib/labels";
import { parseSummaryParams, summaryQuery, type SummaryFilter } from "@/lib/summaryParams";
import { EmptyState, HppBadge, PageHeader, Row } from "@/components/ui";

export const metadata: Metadata = { title: "Costing" };

const FILTER_LABEL: Record<SummaryFilter, string> = {
  semua: "Semua",
  mamis: "Mami's",
  pastry_supplier: "Pastry",
  minuman: "Minuman",
  paket: "Paket",
};

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseSummaryParams(await searchParams);
  const data = await loadCostingData();
  const all = buildSummary(data, params);
  const rows = all.filter((r) => params.filter === "semua" || r.category === params.filter);
  const overCount = rows.filter((r) => r.status === "over").length;

  return (
    <>
      <CostingTabs active="/app/costing" />
      <PageHeader title="Ringkasan HPP" />

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {(Object.keys(FILTER_LABEL) as SummaryFilter[]).map((f) => (
          <Link key={f} href={`/app/costing${summaryQuery(params, { filter: f })}`} className={params.filter === f ? "chip-on" : "chip-off"}>
            {FILTER_LABEL[f]}
          </Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link
          href={`/app/costing${summaryQuery(params, { includePbjt: !params.includePbjt })}`}
          className={params.includePbjt ? "chip-on" : "chip-off"}
          aria-pressed={params.includePbjt}
        >
          {params.includePbjt ? "✓ Harga + PBJT 10%" : "Harga tanpa PBJT"}
        </Link>
        <Link
          href={`/app/costing${summaryQuery(params, { roundingStep: params.roundingStep === 1000 ? 500 : 1000 })}`}
          className="chip-off"
        >
          Bulatkan {formatRupiah(params.roundingStep)}
        </Link>
      </div>

      <p className="mb-3 text-sm text-muted">
        {rows.length} produk ·{" "}
        <span className={overCount ? "font-semibold text-bad" : "font-semibold text-ok"}>
          {overCount} di atas target HPP
        </span>
      </p>

      {rows.length === 0 ? (
        <EmptyState>Belum ada produk. Tambahkan resep atau paket dulu.</EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={`${r.kind}-${r.id}`}>
              <Link
                href={r.kind === "recipe" ? `/app/resep/${r.id}` : `/app/paket/${r.id}`}
                className={`card block border-l-4 ${
                  r.status === "over" ? "border-l-bad" : r.status === "under" ? "border-l-brand-pistachio" : "border-l-black/10"
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold leading-tight">{r.name}</p>
                    <p className="text-xs text-muted">
                      {r.kind === "bundle" ? "Paket" : RECIPE_CATEGORY_LABEL[r.category as keyof typeof RECIPE_CATEGORY_LABEL]}
                      {" · target "}
                      {r.targetHppPct}%
                    </p>
                  </div>
                  <HppBadge hpp={r.hppPct} status={r.status} />
                </div>
                {r.error ? (
                  <p className="text-sm font-semibold text-bad">⚠ {r.error}</p>
                ) : (
                  <>
                    <Row label={r.kind === "bundle" ? "Biaya per paket" : `Biaya per ${r.unit}`} value={formatRupiah(r.cost)} />
                    <Row label={params.includePbjt ? "Harga jual + PBJT" : "Harga jual"} value={formatRupiah(r.displayPrice)} />
                    <Row label="Margin kotor" value={formatRupiah(r.margin)} />
                    <Row label="Saran harga" value={formatRupiah(r.suggestedPrice)} />
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <a href={`/app/costing/export${summaryQuery(params)}`} className="btn-secondary mt-6 w-full" download>
        ⬇ Export CSV
      </a>
    </>
  );
}
