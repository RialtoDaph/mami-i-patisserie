import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { RecipeForm } from "../RecipeForm";

export const metadata: Metadata = { title: "Resep baru" };

export default async function NewRecipePage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  if (!can(user.role, "recipe.edit")) redirect("/app/resep");
  return (
    <>
      <PageHeader title="Resep baru" back="/app/resep" />
      <RecipeForm initial={null} data={data} canEditPricing={can(user.role, "recipe.editPricing")} />
    </>
  );
}
