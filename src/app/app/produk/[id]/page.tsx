import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData, productPhotoUrl } from "@/lib/preorderData";
import { DummyTag, PageHeader } from "@/components/ui";
import { ProductForm } from "../ProductForm";
import { sourceCosts } from "../costs";
import { sourceOptions } from "../sources";

export const metadata: Metadata = { title: "Produk" };

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, pre, costing] = await Promise.all([getCurrentUser(), loadPreorderData(), loadCostingData()]);
  const product = pre.products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <>
      <PageHeader title={can(user.role, "catalog.edit") ? "Ubah produk" : "Produk"} back="/app/produk" />
      {product.isDummy && <p className="mb-3 text-sm text-muted">Ini data contoh <DummyTag show /></p>}
      <ProductForm
        initial={product}
        photoUrl={productPhotoUrl(product.photoPath)}
        sources={sourceOptions(costing)}
        costs={sourceCosts(costing)}
        canEdit={can(user.role, "catalog.edit")}
      />
    </>
  );
}
