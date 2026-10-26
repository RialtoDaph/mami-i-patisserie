import Link from "next/link";
import type { PreorderData } from "@/lib/preorderData";
import { currentCampaign, filterOrders, formatDateId, FULFILL_LABEL, orderCountByCustomer, paymentStatus, todayJakarta, type OrderFilter } from "@/lib/preorder";
import { formatRupiah } from "@/lib/format";
import { orderFilterQuery } from "@/lib/orderParams";
import { EmptyNote, chipClass } from "@/components/app/ui";
import { Icon } from "@/components/brand";
import { PaymentBadge, RepeatBadge, StatusBadge } from "@/components/preorder";

/**
 * Search, filter chips (Aktif · Menunggu DP · open campaigns · Semua) and order cards. Used alone on /app/order and as
 * the left column next to the detail on wide screens. Card links keep the current filter in the URL.
 */
export function OrderList({ data, filter, selectedId }: { data: PreorderData; filter: OrderFilter; selectedId?: string }) {
  const rows = filterOrders(data.orders, data.customers, filter);
  const customers = new Map(data.customers.map((c) => [c.id, c]));
  const counts = orderCountByCustomer(data.orders);
  const total = rows.filter((o) => o.status !== "batal").reduce((s, o) => s + o.total, 0);
  const query = orderFilterQuery(filter);
  const today = todayJakarta();

  // Campaign chips: the current campaign first, then other active ones that still have open orders.
  const current = currentCampaign(data.campaigns, today);
  const campaigns = data.campaigns
    .filter((c) => c.isActive && (c.id === current?.id || data.orders.some((o) => o.campaignId === c.id && o.status !== "batal" && o.status !== "selesai")))
    .sort((a, b) => (a.id === current?.id ? -1 : b.id === current?.id ? 1 : a.preorderOpen.localeCompare(b.preorderOpen)));

  const chip = (label: string, f: OrderFilter, active: boolean) => (
    <Link key={label} href={`/app/order${orderFilterQuery({ ...f, q: filter.q })}`} className={chipClass(active)}>
      {label}
    </Link>
  );
  const noExtra = !filter.from && !filter.to;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <form action="/app/order" className="relative">
        <Icon name="search" size={20} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-muted" />
        <input
          type="search"
          name="q"
          defaultValue={filter.q ?? ""}
          placeholder="Cari nama, WA, MIP-…"
          className="block min-h-12 w-full rounded-md border-[1.5px] border-brand-espresso/18 bg-white pr-3 pl-11 text-base outline-none focus:border-brand-wine"
        />
        {filter.campaignId && <input type="hidden" name="kampanye" value={filter.campaignId} />}
        {filter.status !== "aktif" && <input type="hidden" name="status" value={filter.status ?? "semua"} />}
      </form>

      <div className="no-scrollbar -mx-3.5 flex gap-2 overflow-x-auto px-3.5 nav:mx-0 nav:px-0">
        {chip("Aktif", { status: "aktif" }, filter.status === "aktif" && !filter.campaignId && noExtra)}
        {chip("Menunggu DP", { status: "menunggu_dp" }, filter.status === "menunggu_dp" && !filter.campaignId)}
        {campaigns.map((c) => chip(c.name, { status: "aktif", campaignId: c.id }, filter.campaignId === c.id))}
        {chip("Semua", { status: null }, filter.status == null && !filter.campaignId && noExtra)}
      </div>

      <p className="text-[13px] text-brand-muted">
        {rows.length} order · total {formatRupiah(total)}
      </p>

      {rows.length === 0 ? (
        <EmptyNote>{data.orders.length ? "Tidak ada order yang cocok." : "Belum ada order. Tekan “+ Order”."}</EmptyNote>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((o) => {
            const c = customers.get(o.customerId);
            const selected = o.id === selectedId;
            return (
              <li key={o.id}>
                <Link
                  href={`/app/order/${o.id}${query}`}
                  aria-current={selected ? "page" : undefined}
                  className={`flex flex-col gap-1.5 rounded-md bg-brand-butter-50 px-3.5 py-3 hover:bg-brand-butter ${
                    selected ? "border-2 border-brand-wine" : "border-[1.5px] border-brand-espresso/18"
                  }`}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <b className="text-[15px] leading-tight">{c?.name ?? "?"}</b>
                      <RepeatBadge count={counts.get(o.customerId) ?? 0} />
                      <span className="block text-xs text-brand-muted">
                        {o.orderNo} · {formatDateId(o.fulfillDate).replace(/ \d{4}$/, "")} · {FULFILL_LABEL[o.fulfillMethod]}
                        {o.channel === "web" && " · web"}
                      </span>
                    </span>
                    <StatusBadge status={o.status} />
                  </span>
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] text-brand-muted">{o.items.reduce((s, i) => s + i.qty, 0)} item</span>
                    <span className="text-right">
                      <b className="text-[15px] tabular-nums">{formatRupiah(o.total)}</b>{" "}
                      <PaymentBadge status={paymentStatus(o.total, o.dpAmount, o.amountPaid)} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <details className="rounded-md border-[1.5px] border-dashed border-brand-espresso/22 px-4" open={!noExtra || undefined}>
        <summary className="flex min-h-12 cursor-pointer items-center text-sm font-bold text-brand-muted">Filter tanggal &amp; export</summary>
        <form className="flex flex-col gap-3 pb-4" action="/app/order">
          {filter.q && <input type="hidden" name="q" value={filter.q} />}
          {filter.campaignId && <input type="hidden" name="kampanye" value={filter.campaignId} />}
          {filter.status !== "aktif" && <input type="hidden" name="status" value={filter.status ?? "semua"} />}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-brand-pistachio-deep">Tanggal dari</span>
              <input type="date" name="dari" defaultValue={filter.from ?? ""} className="input" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-brand-pistachio-deep">sampai</span>
              <input type="date" name="sampai" defaultValue={filter.to ?? ""} className="input" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" className="btn-secondary">Terapkan</button>
            <a href={`/app/order/export${query}`} className="btn-secondary" download>
              Export CSV
            </a>
          </div>
        </form>
      </details>
    </div>
  );
}
