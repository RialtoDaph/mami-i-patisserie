import Link from "next/link";
import type { Metadata } from "next";
import { CostingTabs } from "@/components/CostingTabs";
import { buildSummary } from "@/lib/costing";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { formatRupiah } from "@/lib/format";
import { DummyTag, EmptyState, HppBadge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Paket" };

export default async function BundlesPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const rows = new Map(
    buildSummary(data, { roundingStep: 1000, includePbjt: false, includeInactive: true })
      .filter((r) => r.kind === "bundle")
      .map((r) => [r.id, r]),
  );
  return (
    <>
      <CostingTabs active="/app/paket" />
      <PageHeader
        title="Paket & Hampers"
        action={can(user.role, "bundle.edit") ? <Link href="/app/paket/baru" className="btn-primary px-4">+ Paket</Link> : null}
      />
      {data.bundles.length === 0 ? (
        <EmptyState>Belum ada paket.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.bundles.map((b) => {
            const s = rows.get(b.id);
            return (
              <li key={b.id}>
                <Link href={`/app/paket/${b.id}`} className={`card flex items-center justify-between gap-3 ${b.isActive ? "" : "opacity-60"}`}>
                  <div className="min-w-0">
                    <p className="font-semibold leading-tight">
                      {b.name}
                      <DummyTag show={b.isDummy} />
                      {!b.isActive && <span className="ml-1 text-xs text-muted">(nonaktif)</span>}
                    </p>
                    <p className="text-xs text-muted">
                      Biaya {formatRupiah(s?.cost ?? null)} · Jual {formatRupiah(b.sellingPrice)} · {b.items.length} isi
                    </p>
                  </div>
                  {s && <HppBadge hpp={s.hppPct} status={s.status} />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
