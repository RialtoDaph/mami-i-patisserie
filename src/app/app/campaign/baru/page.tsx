import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { PageHeader } from "@/components/ui";
import { CampaignForm } from "../CampaignForm";

export const metadata: Metadata = { title: "Campaign baru" };

export default async function NewCampaignPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  if (!can(user.role, "catalog.edit")) redirect("/app/campaign");
  return (
    <>
      <PageHeader title="Campaign baru" back="/app/campaign" />
      <CampaignForm initial={null} products={data.products} defaultDpPercent={data.settings.defaultDpPercent} canEdit />
    </>
  );
}
