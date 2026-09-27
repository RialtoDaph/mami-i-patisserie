import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPayments, loadPreorderData } from "@/lib/preorderData";
import { deleteOrder, deletePayment } from "@/lib/preorderActions";
import {
  confirmationMessage, dpOutstanding, formatDateId, formatWhatsapp, FULFILL_LABEL, nextStatus, orderCountByCustomer,
  orderProfit, PAYMENT_METHOD_LABEL, paymentReminderMessage, paymentStatus, productCosts, readyMessage, remainingOf,
  shippedMessage, waLink,
} from "@/lib/preorder";
import { formatPercent, formatRupiah } from "@/lib/format";
import { ConfirmActionButton } from "@/components/ConfirmActionButton";
import { DummyTag, PageHeader, Row } from "@/components/ui";
import { PaymentBadge, RepeatBadge, StatusBadge, WaButton } from "@/components/preorder";
import { OrderStatusControls } from "./OrderActions";
import { PaymentForm } from "./PaymentForm";

export const metadata: Metadata = { title: "Detail order" };

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  const [{ id }, { baru }] = await Promise.all([params, searchParams]);
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
  const profit = can(user.role, "profit.view") ? orderProfit(order, productCosts(data.products, await loadCostingData())) : null;

  return (
    <>
      <PageHeader title={order.orderNo} back="/app/order" action={<StatusBadge status={order.status} />} />

      {baru && (
        <div className="card mb-4 border-brand-pistachio bg-ok-bg">
          <p className="mb-3 font-bold text-ink">✓ Order tersimpan. Kirim konfirmasi ke pelanggan:</p>
          <WaButton href={waLink(customer.whatsapp, confirmationMessage(ctx))} label="Kirim konfirmasi WhatsApp" />
        </div>
      )}

      <section className="card mb-4">
        <Link href={`/app/pelanggan/${customer.id}`} className="block">
          <p className="text-lg font-bold">
            {customer.name}
            <RepeatBadge count={orderCountByCustomer(data.orders).get(customer.id) ?? 0} />
            <DummyTag show={order.isDummy} />
          </p>
          <p className="text-sm text-muted">{formatWhatsapp(customer.whatsapp)}</p>
        </Link>
        <div className="mt-2 border-t border-black/5 pt-2">
          <Row label="Tanggal" value={formatDateId(order.fulfillDate)} />
          <Row label="Metode" value={FULFILL_LABEL[order.fulfillMethod]} />
          {order.deliveryAddress && <p className="py-1 text-sm">{order.deliveryAddress}</p>}
          {campaign && <Row label="Campaign" value={campaign.name} />}
          {order.notes && <p className="mt-1 rounded-lg bg-brand-butter-soft px-3 py-2 text-sm">📝 {order.notes}</p>}
        </div>
      </section>

      <section className="card mb-4">
        <h2 className="mb-2 font-bold text-cocoa">Pesanan</h2>
        <ul className="mb-2 flex flex-col gap-1">
          {order.items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-2">
              <span>{i.qty}× {productName(i.productId)}</span>
              <span className="shrink-0 whitespace-nowrap tabular-nums">{formatRupiah(i.qty * i.unitPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="border-t border-black/5 pt-2">
          <Row label="Subtotal" value={formatRupiah(order.subtotal)} />
          {order.shippingFee > 0 && <Row label="Ongkir" value={formatRupiah(order.shippingFee)} />}
          {order.discount > 0 && <Row label="Diskon" value={`-${formatRupiah(order.discount)}`} />}
          <Row label="Total" value={formatRupiah(order.total)} strong />
        </div>
        {profit && (
          <div className="mt-2 border-t border-black/5 pt-2">
            <Row label={`HPP${profit.estimatedItems ? " (estimasi harga saat ini)" : ""}`} value={formatRupiah(profit.hpp)} />
            <Row
              label="Laba kotor"
              value={<span className={profit.profit < 0 ? "text-bad" : "text-ok"}>{formatRupiah(profit.profit)} · {formatPercent(profit.marginPct)}</span>}
            />
            <p className="text-xs text-muted">Subtotal − diskon − HPP. Ongkir tidak dihitung.</p>
            {profit.missingItems > 0 && <p className="text-xs font-semibold text-bad">Ada item tanpa HPP (dihitung Rp 0).</p>}
          </div>
        )}
      </section>

      <section className="card mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold text-cocoa">Pembayaran</h2>
          <PaymentBadge status={pay} />
        </div>
        <Row label="DP diminta" value={formatRupiah(order.dpAmount)} />
        <Row label="Sudah dibayar" value={formatRupiah(order.amountPaid)} />
        <Row label="Sisa" value={formatRupiah(remaining)} strong />
        {payments.length > 0 && (
          <ul className="mt-2 flex flex-col divide-y divide-black/5 border-t border-black/5">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                {p.proofUrl ? (
                  <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.proofUrl} alt="Bukti bayar" className="size-14 rounded-lg object-cover" />
                  </a>
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-black/5 text-xs text-muted">tanpa bukti</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums">{formatRupiah(p.amount)} · {PAYMENT_METHOD_LABEL[p.method]}</p>
                  <p className="text-xs text-muted">{dateTime(p.paidAt)}{p.note && ` · ${p.note}`}</p>
                </div>
                {can(user.role, "payment.delete") && (
                  <ConfirmActionButton
                    action={deletePayment.bind(null, p.id)}
                    confirmText={`Hapus pembayaran ${formatRupiah(p.amount)}?`}
                    label="Hapus"
                    pendingLabel="…"
                    className="min-h-11 rounded-lg px-3 text-sm font-semibold text-bad"
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
              suggestions={[
                ...(dpDue > 0 ? [{ label: "DP", amount: dpDue }] : []),
                { label: "Lunas", amount: remaining },
              ]}
            />
          </div>
        )}
      </section>

      <section className="mb-4 flex flex-col gap-2">
        <h2 className="font-bold text-cocoa">Kirim WhatsApp</h2>
        <WaButton href={waLink(customer.whatsapp, confirmationMessage(ctx))} label="Konfirmasi order" />
        {remaining > 0 && <WaButton href={waLink(customer.whatsapp, paymentReminderMessage(ctx))} label="Pengingat pelunasan" />}
        <WaButton href={waLink(customer.whatsapp, readyMessage(ctx))} label={order.fulfillMethod === "ambil" ? "Info siap diambil" : "Info siap dikirim"} />
        {order.fulfillMethod !== "ambil" && <WaButton href={waLink(customer.whatsapp, shippedMessage(ctx))} label="Info sudah dikirim" />}
      </section>

      {canEdit && (
        <section className="mb-4 flex flex-col gap-3">
          <h2 className="font-bold text-cocoa">Status</h2>
          <OrderStatusControls orderId={order.id} status={order.status} next={next} />
          <Link href={`/app/order/${order.id}/ubah`} className="btn-secondary w-full">Ubah order</Link>
          {can(user.role, "order.delete") && (
            <ConfirmActionButton
              action={deleteOrder.bind(null, order.id)}
              confirmText={`Hapus ${order.orderNo} permanen? (Biasanya cukup dibatalkan.)`}
              label="Hapus permanen"
              pendingLabel="Menghapus…"
              className="btn-danger w-full"
            />
          )}
        </section>
      )}
    </>
  );
}
