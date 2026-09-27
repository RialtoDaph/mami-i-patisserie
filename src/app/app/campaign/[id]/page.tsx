import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { DummyTag, PageHeader } from "@/components/ui";
import { CampaignForm } from "../CampaignForm";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  const campaign = data.campaigns.find((c) => c.id === id);
  if (!campaign) notFound();
  return (
    <>
      <PageHeader title={campaign.name} back="/app/campaign" />
      {campaign.isDummy && <p className="mb-3 text-sm text-muted">Ini data contoh <DummyTag show /></p>}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Link href={`/app/order?kampanye=${id}&status=semua`} className="btn-secondary">Lihat order</Link>
        <Link href={`/app?kampanye=${id}`} className="btn-secondary">Dashboard</Link>
      </div>
      <CampaignForm
        initial={campaign}
        products={data.products}
        defaultDpPercent={data.settings.defaultDpPercent}
        canEdit={can(user.role, "catalog.edit")}
      />
    </>
  );
}
