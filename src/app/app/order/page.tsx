import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { filterOrders, formatDateId, FULFILL_LABEL, orderCountByCustomer, ORDER_STATUSES, paymentStatus, STATUS_LABEL } from "@/lib/preorder";
import { formatRupiah } from "@/lib/format";
import { orderFilterQuery, parseOrderFilter } from "@/lib/orderParams";
import { EmptyState, PageHeader } from "@/components/ui";
import { PaymentBadge, RepeatBadge, StatusBadge } from "@/components/preorder";

export const metadata: Metadata = { title: "Order" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filter = parseOrderFilter(await searchParams);
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  const rows = filterOrders(data.orders, data.customers, filter);
  const customers = new Map(data.customers.map((c) => [c.id, c]));
  const counts = orderCountByCustomer(data.orders);
  const total = rows.filter((o) => o.status !== "batal").reduce((s, o) => s + o.total, 0);
  const filtered = Boolean(filter.campaignId || filter.from || filter.to || filter.q || filter.status !== "aktif");

  return (
    <>
      <PageHeader
        title="Order"
        action={can(user.role, "order.edit") ? <Link href="/app/order/baru" className="btn-primary px-4">+ Order</Link> : null}
      />

      <form className="mb-3 flex gap-2" action="/app/order">
        <input type="search" name="q" defaultValue={filter.q ?? ""} placeholder="Cari nama, no. WA, MIP-…" className="input" />
        {filter.campaignId && <input type="hidden" name="kampanye" value={filter.campaignId} />}
        {filter.status !== "aktif" && <input type="hidden" name="status" value={filter.status ?? "semua"} />}
        <button className="btn-secondary px-4" type="submit">Cari</button>
      </form>

      <details className="card mb-4" open={filtered}>
        <summary className="cursor-pointer font-semibold text-cocoa">Filter{filtered && " (aktif)"}</summary>
        <form className="mt-3 flex flex-col gap-3" action="/app/order">
          {filter.q && <input type="hidden" name="q" value={filter.q} />}
          <label>
            <span className="field-label">Campaign</span>
            <select name="kampanye" defaultValue={filter.campaignId ?? ""} className="input">
              <option value="">Semua</option>
              <option value="none">Tanpa campaign</option>
              {data.campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span className="field-label">Status</span>
            <select name="status" defaultValue={filter.status ?? "semua"} className="input">
              <option value="aktif">Aktif (belum selesai)</option>
              <option value="semua">Semua</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="field-label">Tanggal dari</span><input type="date" name="dari" defaultValue={filter.from ?? ""} className="input" /></label>
            <label><span className="field-label">sampai</span><input type="date" name="sampai" defaultValue={filter.to ?? ""} className="input" /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/app/order" className="btn-secondary">Reset</Link>
            <button type="submit" className="btn-primary">Terapkan</button>
          </div>
        </form>
      </details>

      <p className="mb-3 text-sm text-muted">{rows.length} order · total {formatRupiah(total)}</p>

      {rows.length === 0 ? (
        <EmptyState>{data.orders.length ? "Tidak ada order yang cocok." : "Belum ada order. Tekan “+ Order”."}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((o) => {
            const c = customers.get(o.customerId);
            return (
              <li key={o.id}>
                <Link href={`/app/order/${o.id}`} className="card block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold leading-tight">
                        {c?.name ?? "?"}
                        <RepeatBadge count={counts.get(o.customerId) ?? 0} />
                      </p>
                      <p className="text-xs text-muted">{o.orderNo} · {formatDateId(o.fulfillDate)} · {FULFILL_LABEL[o.fulfillMethod]}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="truncate text-sm text-muted">{o.items.reduce((s, i) => s + i.qty, 0)} item</span>
                    <span className="text-right">
                      <b className="tabular-nums">{formatRupiah(o.total)}</b>{" "}
                      <PaymentBadge status={paymentStatus(o.total, o.dpAmount, o.amountPaid)} />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <a href={`/app/order/export${orderFilterQuery(filter)}`} className="btn-secondary mt-6 w-full" download>⬇ Export CSV</a>
    </>
  );
}
