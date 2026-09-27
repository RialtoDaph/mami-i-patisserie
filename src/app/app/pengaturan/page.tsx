import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { loadPreorderData } from "@/lib/preorderData";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadPreorderData()]);
  return (
    <>
      <PageHeader title="Pengaturan" back="/app/lainnya" />
      <SettingsForm settings={data.settings} canEdit={can(user.role, "settings.edit")} />
    </>
  );
}
