import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import {
  addDays, dashboardStats, formatDateId, isOpen, productionSchedule, STATUS_LABEL, todayJakarta, type OrderStatus,
} from "@/lib/preorder";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { ProductionDay } from "@/components/ProductionDay";
import { StatusBadge } from "@/components/preorder";

export const metadata: Metadata = { title: "Beranda" };

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bad" | "ok" }) {
  return (
    <div className="card p-3">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${tone === "bad" ? "text-bad" : tone === "ok" ? "text-ok" : "text-cocoa"}`}>{value}</p>
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ kampanye?: string }> }) {
  const { kampanye } = await searchParams;
  const [user, pre, costing] = await Promise.all([getCurrentUser(), loadPreorderData(), loadCostingData()]);
  const today = todayJakarta();
  const [todayPlan, tomorrowPlan] = productionSchedule(pre.orders, pre.products, costing.recipes, costing.bundles, today, 2);
  const upcoming = pre.orders
    .filter((o) => isOpen(o.status) && o.fulfillDate >= today && o.fulfillDate <= addDays(today, 3))
    .slice(0, 8);
  const names = new Map(pre.customers.map((c) => [c.id, c.name]));

  const production = (
    <>
      {can(user.role, "order.edit") && <Link href="/app/order/baru" className="btn-primary mb-4 w-full text-lg">+ Order baru</Link>}
      <h2 className="mb-2 font-bold text-cocoa">Produksi</h2>
      <div className="mb-4 flex flex-col gap-2">
        <ProductionDay day={todayPlan} today={today} />
        <ProductionDay day={tomorrowPlan} today={today} />
        <Link href="/app/produksi" className="text-sm font-semibold text-cocoa underline">Lihat jadwal lengkap →</Link>
      </div>
      <h2 className="mb-2 font-bold text-cocoa">Order 3 hari ke depan</h2>
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted">Tidak ada.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {upcoming.map((o) => (
            <li key={o.id}>
              <Link href={`/app/order/${o.id}`} className="card flex items-center justify-between gap-2 p-3">
                <span>
                  <b>{names.get(o.customerId)}</b>
                  <span className="block text-xs text-muted">{o.orderNo} · {formatDateId(o.fulfillDate)}</span>
                </span>
                <StatusBadge status={o.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (!can(user.role, "dashboard.view")) {
    return (
      <>
        <PageHeader title={`Halo${user.fullName ? `, ${user.fullName}` : ""}!`} />
        {production}
      </>
    );
  }

  const campaign = pre.campaigns.find((c) => c.id === kampanye) ?? null;
  const orders = campaign ? pre.orders.filter((o) => o.campaignId === campaign.id) : pre.orders;
  const s = dashboardStats(orders, pre.products, pre.customers);
  const statusOrder: OrderStatus[] = ["baru", "menunggu_dp", "dp_diterima", "diproduksi", "siap", "dikirim", "selesai", "batal"];

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href="/app" className={!campaign ? "chip-on" : "chip-off"}>Semua</Link>
        {pre.campaigns.map((c) => (
          <Link key={c.id} href={`/app?kampanye=${c.id}`} className={campaign?.id === c.id ? "chip-on" : "chip-off"}>{c.name}</Link>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Stat label="Total order" value={String(s.orderCount)} />
        <Stat label="Omzet" value={formatRupiah(s.revenue)} />
        <Stat label="Sudah dibayar" value={formatRupiah(s.paid)} tone="ok" />
        <Stat label="Belum lunas" value={formatRupiah(s.outstanding)} tone={s.outstanding > 0 ? "bad" : undefined} />
        <Link href={`/app/order?status=menunggu_dp${campaign ? `&kampanye=${campaign.id}` : ""}`} className="col-span-2">
          <Stat label={`DP belum masuk · ${s.dpPendingCount} order`} value={formatRupiah(s.dpPendingAmount)} tone={s.dpPendingCount ? "bad" : "ok"} />
        </Link>
      </div>

      <section className="card mb-4">
        <h2 className="mb-2 font-bold text-cocoa">Status order</h2>
        <div className="flex flex-wrap gap-2">
          {statusOrder.filter((st) => s.byStatus[st] > 0).map((st) => (
            <Link key={st} href={`/app/order?status=${st}${campaign ? `&kampanye=${campaign.id}` : ""}`} className="chip-off">
              {STATUS_LABEL[st]} · {s.byStatus[st]}
            </Link>
          ))}
          {s.orderCount + s.cancelledCount === 0 && <span className="text-sm text-muted">Belum ada order.</span>}
        </div>
      </section>

      <section className="card mb-4">
        <h2 className="mb-2 font-bold text-cocoa">Produk terlaris</h2>
        {s.topProducts.length === 0 ? <p className="text-sm text-muted">Belum ada.</p> : (
          <ol className="flex flex-col gap-1">
            {s.topProducts.map((p, i) => (
              <li key={p.productId} className="flex justify-between gap-2">
                <span>{i + 1}. {p.name}</span>
                <span className="tabular-nums"><b>{p.qty}</b> <span className="text-sm text-muted">· {formatRupiah(p.revenue)}</span></span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card mb-6">
        <h2 className="mb-2 font-bold text-cocoa">Pelanggan order ulang</h2>
        {s.repeatCustomers.length === 0 ? <p className="text-sm text-muted">Belum ada.</p> : (
          <ul className="flex flex-col gap-1">
            {s.repeatCustomers.slice(0, 10).map((c) => (
              <li key={c.customerId}>
                <Link href={`/app/pelanggan/${c.customerId}`} className="flex justify-between gap-2 py-1">
                  <span>{c.name}</span>
                  <span className="tabular-nums"><b>{c.orderCount}x</b> <span className="text-sm text-muted">· {formatRupiah(c.total)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {production}
    </>
  );
}
