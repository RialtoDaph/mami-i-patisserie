import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { BundleForm } from "../BundleForm";

export const metadata: Metadata = { title: "Paket baru" };

export default async function NewBundlePage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  if (!can(user.role, "bundle.edit")) redirect("/app/paket");
  return (
    <>
      <PageHeader title="Paket baru" back="/app/paket" />
      <BundleForm initial={null} data={data} />
    </>
  );
}
