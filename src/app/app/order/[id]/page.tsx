import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPayments, loadPreorderData } from "@/lib/preorderData";
import { deleteOrder, deletePayment, reviewPayment } from "@/lib/preorderActions";
import {
  canSetStatus, confirmationMessage, dpOutstanding, formatDateId, formatWhatsapp, FULFILL_LABEL, nextStatus, orderCountByCustomer,
  orderProfit, PAYMENT_METHOD_LABEL, paymentReminderMessage, paymentStatus, productCosts, readyMessage, remainingOf,
  shippedMessage, waLink,
} from "@/lib/preorder";
import { parseOrderFilter, orderFilterQuery } from "@/lib/orderParams";
import { formatPercent, formatRupiah } from "@/lib/format";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { DummyTag } from "@/components/ui";
import { Panel, PanelTitle } from "@/components/app/ui";
import { Icon } from "@/components/brand";
import { PaymentBadge, RepeatBadge, StatusBadge, WaButton } from "@/components/preorder";
import { OrderList } from "../OrderList";
import { NextStatusButton, OrderStatusControls } from "./OrderActions";
import { PaymentForm } from "./PaymentForm";

export const metadata: Metadata = { title: "Detail order" };

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

function Line({ label, value, strong }: { label: React.ReactNode; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${strong ? "text-[17px] font-bold" : "text-[15px]"}`}>
      <span className={strong ? "" : "text-brand-muted"}>{label}</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const filter = parseOrderFilter(sp);
  const [user, data, payments] = await Promise.all([getCurrentUser(), loadPreorderData(), loadPayments(id)]);
  const order = data.orders.find((o) => o.id === id);
  if (!order) notFound();
  const customer = data.customers.find((c) => c.id === order.customerId)!;
  const campaign = data.campaigns.find((c) => c.id === order.campaignId);
  const productName = (pid: string) => data.products.find((p) => p.id === pid)?.name ?? "?";
  const ctx = { order, customer, settings: data.settings, productName };
  const pay = paymentStatus(order.total, order.dpAmount, order.amountPaid);
  const remaining = remainingOf(order.total, order.amountPaid);
  const dpDue = dpOutstanding(order.dpAmount, order.amountPaid);
  const next = nextStatus(order.status, order.fulfillMethod);
  const canEdit = can(user.role, "order.edit");
  const isOwnerish = canSetStatus(user.role, "batal");
  const profit = can(user.role, "profit.view") ? orderProfit(order, productCosts(data.products, await loadCostingData())) : null;
  const pendingProofs = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="grid items-start gap-5 wide:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
      <div className="hidden wide:block">
        <OrderList data={data} filter={filter} selectedId={order.id} />
      </div>

      <div className="flex max-w-[760px] min-w-0 flex-col gap-3">
        <Link href={`/app/order${orderFilterQuery(filter)}`} className="flex min-h-11 items-center gap-1.5 self-start text-[15px] font-bold wide:hidden">
          <Icon name="arrow_back" size={22} /> Semua order
        </Link>

        {sp.baru && (
          <div className="flex flex-col gap-3 rounded-md border-[1.5px] border-brand-pistachio bg-brand-pistachio-50 p-4">
            <p className="font-bold">Order tersimpan. Kirim konfirmasi ke pelanggan:</p>
            <WaButton href={waLink(customer.whatsapp, confirmationMessage(ctx))} label="Kirim konfirmasi WhatsApp" />
          </div>
        )}

        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold tracking-[.14em] text-brand-pistachio-deep">{order.orderNo}</span>
              <Link href={`/app/pelanggan/${customer.id}`} className="block">
                <h2 className="font-display text-[22px] leading-tight font-bold">
                  {customer.name}
                  <RepeatBadge count={orderCountByCustomer(data.orders).get(customer.id) ?? 0} />
                  <DummyTag show={order.isDummy} />
                </h2>
                <span className="text-sm text-brand-muted">{formatWhatsapp(customer.whatsapp)}</span>
              </Link>
            </div>
            <StatusBadge status={order.status} />
          </div>
          {order.channel === "web" && (
            <p className="mt-2 text-[13px] font-bold text-brand-muted">
              Order dari website{order.payMode ? ` · pilih ${order.payMode === "lunas" ? "lunas" : "DP"}` : ""}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 border-t-[1.5px] border-dashed border-brand-espresso/25 pt-3">
            <div>
              <span className="block text-[13px] font-bold text-brand-pistachio-deep">Tanggal</span>
              <b className="text-[15px]">{formatDateId(order.fulfillDate).replace(/ \d{4}$/, "")}</b>
            </div>
            <div>
              <span className="block text-[13px] font-bold text-brand-pistachio-deep">Metode</span>
              <b className="text-[15px]">
                {FULFILL_LABEL[order.fulfillMethod]}
                {order.deliveryArea && ` · ${order.deliveryArea}`}
                {order.pickupSlot && ` · jam ${order.pickupSlot}`}
              </b>
            </div>
            {campaign && (
              <div className="col-span-2">
                <span className="block text-[13px] font-bold text-brand-pistachio-deep">Campaign</span>
                <b className="text-[15px]">{campaign.name}</b>
              </div>
            )}
          </div>
          {order.deliveryAddress && <p className="mt-2 text-[15px]">{order.deliveryAddress}</p>}
          {order.notes && (
            <p className="mt-3 flex items-start gap-2 rounded-md bg-brand-butter px-3 py-2.5 text-[15px]">
              <Icon name="edit_note" size={20} className="mt-0.5" />
              {order.notes}
            </p>
          )}
          <ul className="mt-3 flex flex-col">
            {order.items.map((i, n) => (
              <li key={`${i.productId}-${n}`} className="flex flex-col gap-1 border-t border-brand-espresso/8 py-2">
                <span className="flex justify-between gap-3 text-[15px]">
                  <span>{i.qty}× {productName(i.productId)}</span>
                  <span className="shrink-0 tabular-nums">{formatRupiah(i.qty * i.unitPrice)}</span>
                </span>
                {i.cardNote && <span className="rounded-md bg-brand-butter-100 px-3 py-1.5 font-script text-base">Kartu: {i.cardNote}</span>}
              </li>
            ))}
          </ul>
          <div className="border-t border-brand-espresso/8 pt-1">
            {(order.shippingFee > 0 || order.discount > 0) && <Line label="Subtotal" value={formatRupiah(order.subtotal)} />}
            {order.shippingFee > 0 && <Line label="Ongkir" value={formatRupiah(order.shippingFee)} />}
            {order.discount > 0 && <Line label="Diskon" value={`-${formatRupiah(order.discount)}`} />}
            <Line label="Total" value={formatRupiah(order.total)} strong />
          </div>
          {profit && (
            <div className="mt-1 border-t border-brand-espresso/8 pt-1">
              <Line label={`HPP${profit.estimatedItems ? " (estimasi harga saat ini)" : ""}`} value={formatRupiah(profit.hpp)} />
              <Line
                label="Laba kotor"
                value={<span className={profit.profit < 0 ? "text-brand-wine" : "text-brand-olive"}>{formatRupiah(profit.profit)} · {formatPercent(profit.marginPct)}</span>}
              />
              <p className="text-xs text-brand-muted">Subtotal − diskon − HPP. Ongkir tidak dihitung.</p>
              {profit.missingItems > 0 && <p className="text-xs font-bold text-brand-wine">Ada item tanpa HPP (dihitung Rp 0).</p>}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelTitle aside={<PaymentBadge status={pay} />}>Pembayaran</PanelTitle>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              ["DP diminta", order.dpAmount],
              ["Dibayar", order.amountPaid],
              ["Sisa", remaining],
            ].map(([label, v]) => (
              <div key={label as string}>
                <span className="block text-[13px] font-bold text-brand-pistachio-deep">{label}</span>
                <b className="text-[15px] tabular-nums">{formatRupiah(v as number)}</b>
              </div>
            ))}
          </div>
          {pendingProofs > 0 && (
            <p className="mt-3 rounded-md bg-brand-wine-50 px-3 py-2 text-sm font-bold text-brand-wine">
              {pendingProofs} bukti bayar dari website belum dicek. Cocokkan dengan mutasi/QRIS, lalu tekan &ldquo;Bukti cocok&rdquo;.
            </p>
          )}
          {payments.length > 0 && (
            <ul className="mt-3 flex flex-col">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-t border-brand-espresso/8 py-2.5">
                  {p.proofUrl ? (
                    <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.proofUrl} alt="Bukti bayar" className="size-14 rounded-md object-cover" />
                    </a>
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-brand-espresso/6 text-center text-[11px] text-brand-muted">tanpa bukti</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold tabular-nums ${p.status === "rejected" ? "text-brand-muted line-through" : ""}`}>
                      {formatRupiah(p.amount)} · {PAYMENT_METHOD_LABEL[p.method]}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {dateTime(p.paidAt)}
                      {p.note && ` · ${p.note}`}
                      {p.status === "pending" && <b className="text-brand-wine"> · belum dicek</b>}
                      {p.status === "rejected" && " · ditolak"}
                    </p>
                    {p.status === "pending" && can(user.role, "payment.delete") && (
                      <div className="mt-2 flex gap-2">
                        <ConfirmActionButton
                          action={reviewPayment.bind(null, p.id, "matched")}
                          confirmText={`Bukti ${formatRupiah(p.amount)} cocok dengan mutasi/QRIS?`}
                          label="Bukti cocok"
                          pendingLabel="…"
                          className="min-h-11 rounded-md bg-brand-olive px-4 text-sm font-bold text-brand-butter"
                        />
                        <ConfirmActionButton
                          action={reviewPayment.bind(null, p.id, "rejected")}
                          confirmText="Tolak bukti ini?"
                          label="Tolak"
                          pendingLabel="…"
                          className="min-h-11 rounded-md border-[1.5px] border-brand-wine px-4 text-sm font-bold text-brand-wine"
                        />
                      </div>
                    )}
                  </div>
                  {can(user.role, "payment.delete") && (
                    <ConfirmActionButton
                      action={deletePayment.bind(null, p.id)}
                      confirmText={`Hapus pembayaran ${formatRupiah(p.amount)}?`}
                      label="Hapus"
                      pendingLabel="…"
                      className="min-h-11 rounded-md px-3 text-sm font-bold text-brand-wine"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {can(user.role, "payment.add") && remaining > 0 && order.status !== "batal" && (
            <div className="mt-3">
              <PaymentForm
                orderId={order.id}
                suggestions={[...(dpDue > 0 && dpDue < remaining ? [{ label: "DP", amount: dpDue }] : []), { label: "Lunas", amount: remaining }]}
              />
            </div>
          )}
        </Panel>

        {canEdit && next && canSetStatus(user.role, next) && <NextStatusButton orderId={order.id} next={next} />}

        <WaButton href={waLink(customer.whatsapp, confirmationMessage(ctx))} label="Kirim konfirmasi WhatsApp" />
        <details className="rounded-md border-[1.5px] border-brand-espresso/18 bg-brand-butter-50 px-4">
          <summary className="flex min-h-12 cursor-pointer items-center text-[15px] font-bold">Pesan WhatsApp lain</summary>
          <div className="flex flex-col gap-2 pb-4">
            {remaining > 0 && <WaButton href={waLink(customer.whatsapp, paymentReminderMessage(ctx))} label="Pengingat pelunasan" />}
            <WaButton href={waLink(customer.whatsapp, readyMessage(ctx))} label={order.fulfillMethod === "ambil" ? "Info siap diambil" : "Info siap dikirim"} />
            {order.fulfillMethod !== "ambil" && <WaButton href={waLink(customer.whatsapp, shippedMessage(ctx))} label="Info sudah dikirim" />}
          </div>
        </details>

        {canEdit && isOwnerish && (
          <details className="rounded-md border-[1.5px] border-dashed border-brand-espresso/22 px-4">
            <summary className="flex min-h-12 cursor-pointer items-center text-[15px] font-bold text-brand-muted">Ubah order &amp; status</summary>
            <div className="flex flex-col gap-3 pb-4">
              <Link href={`/app/order/${order.id}/ubah`} className="btn-secondary w-full">Ubah order</Link>
              <OrderStatusControls orderId={order.id} status={order.status} />
              {can(user.role, "order.delete") && (
                <ConfirmActionButton
                  action={deleteOrder.bind(null, order.id)}
                  confirmText={`Hapus ${order.orderNo} permanen? (Biasanya cukup dibatalkan.)`}
                  label="Hapus permanen"
                  pendingLabel="Menghapus…"
                  className="min-h-12 w-full rounded-md text-[15px] font-bold text-brand-wine underline"
                />
              )}
            </div>
          </details>
        )}
        {canEdit && !isOwnerish && (
          <Link href={`/app/order/${order.id}/ubah`} className="btn-secondary w-full">Ubah order</Link>
        )}
      </div>
    </div>
  );
}
