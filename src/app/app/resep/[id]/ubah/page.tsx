import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, loadCostingData } from "@/lib/data";
import { can } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";
import { RecipeForm } from "../../RecipeForm";

export const metadata: Metadata = { title: "Ubah resep" };

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const recipe = data.recipes.find((r) => r.id === id);
  if (!recipe) notFound();
  if (!can(user.role, "recipe.edit")) redirect(`/app/resep/${id}`);
  return (
    <>
      <PageHeader title="Ubah resep" back={`/app/resep/${id}`} />
      <RecipeForm initial={recipe} data={data} canEditPricing={can(user.role, "recipe.editPricing")} />
    </>
  );
}
