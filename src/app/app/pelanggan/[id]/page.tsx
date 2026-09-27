import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { formatDateId, orderCountByCustomer, waLink } from "@/lib/preorder";
import { formatRupiah } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { RepeatBadge, StatusBadge, WaButton } from "@/components/preorder";
import { CustomerForm } from "./CustomerForm";

export const metadata: Metadata = { title: "Pelanggan" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  const customer = data.customers.find((c) => c.id === id);
  if (!customer) notFound();
  const orders = data.orders.filter((o) => o.customerId === id).sort((a, b) => b.fulfillDate.localeCompare(a.fulfillDate));
  const count = orderCountByCustomer(data.orders).get(id) ?? 0;
  const total = orders.filter((o) => o.status !== "batal").reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHeader title={customer.name} back="/app/pelanggan" />
      <p className="-mt-3 mb-4 text-sm text-muted">
        {count} order · {formatRupiah(total)}
        <RepeatBadge count={count} />
      </p>
      <div className="mb-4 flex flex-col gap-2">
        {can(user.role, "order.edit") && <Link href={`/app/order/baru?pelanggan=${id}`} className="btn-primary w-full">+ Order untuk {customer.name}</Link>}
        <WaButton href={waLink(customer.whatsapp, `Halo ${customer.name}, `)} label="Chat WhatsApp" />
      </div>
      <CustomerForm customer={customer} canEdit={can(user.role, "order.edit")} />
      <h2 className="mt-6 mb-2 font-bold text-cocoa">Riwayat order</h2>
      <ul className="flex flex-col gap-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/app/order/${o.id}`} className="card flex items-center justify-between gap-2 p-3">
              <span>
                <b>{o.orderNo}</b>
                <span className="block text-xs text-muted">{formatDateId(o.fulfillDate)} · {formatRupiah(o.total)}</span>
              </span>
              <StatusBadge status={o.status} />
            </Link>
          </li>
        ))}
        {orders.length === 0 && <li className="text-sm text-muted">Belum ada order.</li>}
      </ul>
    </>
  );
}
