import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { PageHeader } from "@/components/ui";
import { OrderForm } from "../OrderForm";
import { orderFormProps } from "../formProps";

export const metadata: Metadata = { title: "Order baru" };

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ pelanggan?: string }> }) {
  const { pelanggan } = await searchParams;
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  if (!can(user.role, "order.edit")) redirect("/app/order");
  const prefill = data.customers.find((c) => c.id === pelanggan) ?? null;
  return (
    <>
      <PageHeader title="Order baru" back="/app/order" />
      <OrderForm {...orderFormProps(data, null, prefill)} />
    </>
  );
}
