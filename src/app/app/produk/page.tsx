import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData, productPhotoUrl } from "@/lib/preorderData";
import { hppPct, hppStatus } from "@/lib/costing";
import { formatRupiah } from "@/lib/format";
import { DummyTag, EmptyState, HppBadge, PageHeader } from "@/components/ui";
import { ProductThumb } from "@/components/preorder";
import { sourceCosts } from "./costs";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductsPage() {
  const [user, pre, costing] = await Promise.all([getCurrentUser(), loadPreorderData(), loadCostingData()]);
  const costs = sourceCosts(costing);
  return (
    <>
      <PageHeader
        title="Produk"
        back="/app/lainnya"
        action={can(user.role, "catalog.edit") ? <Link href="/app/produk/baru" className="btn-primary px-4">+ Produk</Link> : null}
      />
      {pre.products.length === 0 ? <EmptyState>Belum ada produk.</EmptyState> : (
        <ul className="flex flex-col gap-2">
          {pre.products.map((p) => {
            const unitCost = costs[p.recipeId ? `r:${p.recipeId}` : `b:${p.bundleId}`];
            const cost = unitCost == null ? null : unitCost * p.unitsPerProduct;
            const hpp = cost == null ? null : hppPct(cost, p.price);
            return (
              <li key={p.id}>
                <Link href={`/app/produk/${p.id}`} className={`card flex items-center gap-3 ${p.isActive ? "" : "opacity-60"}`}>
                  <ProductThumb url={productPhotoUrl(p.photoPath)} name={p.name} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{p.name}<DummyTag show={p.isDummy} /></p>
                    <p className="text-sm text-muted">
                      {formatRupiah(p.price)} · {p.weeklyCapacity ? `${p.weeklyCapacity}/minggu` : "tanpa batas"} · H-{p.minLeadDays}
                    </p>
                    <p className="text-xs text-muted">
                      {!p.preorderEnabled && "Preorder ditutup · "}
                      {p.showOnWebsite ? "Tampil di website" : "Tidak di website"}
                      {!p.isActive && " · nonaktif"}
                    </p>
                  </div>
                  <HppBadge hpp={hpp} status={hppStatus(hpp, 35)} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
