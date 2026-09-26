import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { BundleForm } from "../../BundleForm";

export const metadata: Metadata = { title: "Ubah paket" };

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const bundle = data.bundles.find((b) => b.id === id);
  if (!bundle) notFound();
  if (!can(user.role, "bundle.edit")) redirect(`/app/paket/${id}`);
  return (
    <>
      <PageHeader title="Ubah paket" back={`/app/paket/${id}`} />
      <BundleForm initial={bundle} data={data} />
    </>
  );
}
