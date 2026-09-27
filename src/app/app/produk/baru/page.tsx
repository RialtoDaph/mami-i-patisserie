import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "../ProductForm";
import { sourceCosts } from "../costs";
import { sourceOptions } from "../sources";

export const metadata: Metadata = { title: "Produk baru" };

export default async function NewProductPage() {
  const [user, costing] = await Promise.all([getCurrentUser(), loadCostingData()]);
  if (!can(user.role, "catalog.edit")) redirect("/app/produk");
  return (
    <>
      <PageHeader title="Produk baru" back="/app/produk" />
      <ProductForm initial={null} photoUrl={null} sources={sourceOptions(costing)} costs={sourceCosts(costing)} canEdit />
    </>
  );
}
