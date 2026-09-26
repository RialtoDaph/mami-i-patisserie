import Link from "next/link";
import type { Metadata } from "next";
import { loadCostingData, getCurrentUser } from "@/lib/data";
import { can } from "@/lib/permissions";
import { pricePerBaseUnit } from "@/lib/costing";
import { PageHeader } from "@/components/ui";
import { IngredientList, type IngredientListItem } from "./IngredientList";

export const metadata: Metadata = { title: "Bahan" };

export default async function IngredientsPage() {
  const [user, data] = await Promise.all([getCurrentUser(), loadCostingData()]);
  const items: IngredientListItem[] = data.ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    supplier: i.supplier,
    purchaseUnit: i.purchaseUnit,
    purchaseQty: i.purchaseQty,
    purchasePrice: i.purchasePrice,
    baseUnit: i.baseUnit,
    pricePerBase: pricePerBaseUnit(i),
    isDummy: i.isDummy,
  }));

  return (
    <>
      <PageHeader
        title="Bahan & Kemasan"
        action={
          can(user.role, "ingredient.edit") ? (
            <Link href="/app/bahan/baru" className="btn-primary px-4">+ Tambah</Link>
          ) : null
        }
      />
      <IngredientList items={items} />
    </>
  );
}
