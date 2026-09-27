import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { PageHeader } from "@/components/ui";
import { OrderForm } from "../../OrderForm";
import { orderFormProps } from "../../formProps";

export const metadata: Metadata = { title: "Ubah order" };

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  const order = data.orders.find((o) => o.id === id);
  const customer = order && data.customers.find((c) => c.id === order.customerId);
  if (!order || !customer) notFound();
  if (!can(user.role, "order.edit")) redirect(`/app/order/${id}`);
  return (
    <>
      <PageHeader title={`Ubah ${order.orderNo}`} back={`/app/order/${id}`} />
      <OrderForm {...orderFormProps(data, { order, customer })} />
    </>
  );
}
