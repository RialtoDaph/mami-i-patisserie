import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { IngredientForm } from "../IngredientForm";

export const metadata: Metadata = { title: "Tambah bahan" };

export default async function NewIngredientPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  if (!can(user.role, "ingredient.edit")) redirect("/app/bahan");
  return (
    <>
      <PageHeader title="Tambah bahan" back="/app/bahan" />
      <IngredientForm initial={null} data={data} canEdit canDelete={false} />
    </>
  );
}
